"""Offline tests: python -m unittest discover -s scripts/tests."""
import contextlib
import hashlib
import io
import json
from pathlib import Path
import tempfile
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import setup_comfy as setup


class Response(io.BytesIO):
    def __init__(self, body, status=200, headers=None):
        super().__init__(body)
        self.status = status
        self.headers = headers or {}


class InstallerTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="comfy installer ")
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.body = b"example model bytes" * 500
        self.item = dict(repo="test/model", revision="fixed", source="weights.bin",
                         target="models/example.bin", size=len(self.body),
                         sha256=hashlib.sha256(self.body).hexdigest())
        self.target = self.root / self.item["target"]
        self.part = self.target.with_name(self.target.name + ".part")
        self.target.parent.mkdir()
        self.addCleanup(patch.stopall)
        patch("setup_comfy.time.sleep").start()

    def download(self):
        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            setup.download(self.item, self.root, attempts=2)

    def test_partial_download_resumes_and_is_verified(self):
        self.part.write_bytes(self.body[:100])
        response = Response(self.body[100:], 206, {"Content-Range": f"bytes 100-{len(self.body)-1}/{len(self.body)}"})
        with patch("setup_comfy.urllib.request.urlopen", return_value=response) as request:
            self.download()
        self.assertEqual(request.call_args.args[0].get_header("Range"), "bytes=100-")
        self.assertEqual(self.target.read_bytes(), self.body)
        self.assertFalse(self.part.exists())

    def test_server_ignoring_range_restarts_without_duplicating_bytes(self):
        self.part.write_bytes(self.body[:100])
        with patch("setup_comfy.urllib.request.urlopen", return_value=Response(self.body)):
            self.download()
        self.assertEqual(self.target.read_bytes(), self.body)

    def test_truncated_response_is_retried_from_saved_offset(self):
        responses = [Response(self.body[:100]), Response(self.body[100:], 206,
                     {"Content-Range": f"bytes 100-{len(self.body)-1}/{len(self.body)}"})]
        with patch("setup_comfy.urllib.request.urlopen", side_effect=responses) as request:
            self.download()
        self.assertEqual(request.call_args.args[0].get_header("Range"), "bytes=100-")
        self.assertEqual(self.target.read_bytes(), self.body)

    def test_corrupt_download_never_becomes_a_model(self):
        with patch("setup_comfy.urllib.request.urlopen", side_effect=[Response(b"x" * len(self.body)), Response(b"x" * len(self.body))]):
            with self.assertRaises(RuntimeError):
                self.download()
        self.assertFalse(self.target.exists())

    def test_bad_content_range_is_rejected_without_appending(self):
        self.part.write_bytes(self.body[:100])
        with patch("setup_comfy.urllib.request.urlopen", return_value=Response(self.body, 206, {"Content-Range": "bytes 0-99/100"})):
            with self.assertRaises(ValueError):
                self.download()
        self.assertEqual(self.part.read_bytes(), self.body[:100])

    def test_existing_corrupt_file_is_preserved(self):
        self.target.write_bytes(b"student's model")
        with self.assertRaises(ValueError):
            self.download()
        self.assertEqual(self.target.read_bytes(), b"student's model")

    def test_verified_existing_file_needs_no_network(self):
        self.target.write_bytes(self.body)
        with patch("setup_comfy.urllib.request.urlopen") as request:
            self.download()
        request.assert_not_called()

    def test_git_blob_hash_verification(self):
        self.target.write_bytes(self.body)
        self.item["sha256"] = None
        self.item["git_blob_sha1"] = hashlib.sha1(f"blob {len(self.body)}\0".encode() + self.body).hexdigest()
        with patch("setup_comfy.urllib.request.urlopen") as request:
            self.download()
        request.assert_not_called()

    def test_backup_preserves_modified_workflow_and_is_idempotent(self):
        source = self.root / "new.json"
        source.write_text("new workflow")
        self.target.write_text("student edits")
        setup.copy_with_backup(source, self.target)
        setup.copy_with_backup(source, self.target)
        self.assertEqual(self.target.read_text(), "new workflow")
        self.assertEqual(self.target.with_name(self.target.name + ".bak").read_text(), "student edits")
        self.assertFalse(self.target.with_name(self.target.name + ".bak.1").exists())

    def test_paths_cannot_escape_installation(self):
        with self.assertRaises(ValueError):
            setup.safe_target(self.root, "../outside")

    def test_all_supplied_workflows_have_models_and_images(self):
        items = json.loads((setup.HERE / "models.json").read_text())["files"]
        workflows = setup.demo_plan(setup.HERE.parent / "demos", items)
        self.assertEqual(len(workflows), 12)
        self.assertEqual(len({item["target"] for item in items}), len(items))
        for item in items:
            self.assertGreater(item["size"], 0)
            self.assertEqual(len(item["revision"]), 40)
            self.assertEqual(len(item["sha256"] or item["git_blob_sha1"]), 64 if item["sha256"] else 40)

    def test_backend_aliases_and_apple_detection(self):
        self.assertEqual(setup.backend_for("amd"), "rocm")
        self.assertEqual(setup.backend_for("nvidia"), "cuda")
        self.assertEqual(setup.backend_for("metal"), "mps")
        with patch("setup_comfy.platform.system", return_value="Darwin"), patch("setup_comfy.platform.machine", return_value="arm64"):
            self.assertEqual(setup.backend_for("auto"), "mps")

    def test_windows_supported_and_unsupported_amd_devices(self):
        from types import SimpleNamespace
        cases = [
            ({"gpus": ["AMD Radeon RX 9070 XT"], "cpus": []}, 26100, "rocm"),
            ({"gpus": ["AMD Radeon RX 9070 XT"], "cpus": []}, 19045, "cpu"),
            ({"gpus": ["AMD Radeon RX 580"], "cpus": []}, 26100, "cpu"),
            ({"gpus": ["AMD Radeon Graphics"], "cpus": ["AMD Ryzen AI Max+ 395"]}, 26100, "rocm"),
        ]
        for hardware, build, expected in cases:
            with self.subTest(hardware=hardware, build=build), patch("setup_comfy.platform.system", return_value="Windows"), patch("setup_comfy.shutil.which", return_value=None), patch("setup_comfy.windows_hardware", return_value=hardware), patch("setup_comfy.sys.getwindowsversion", return_value=SimpleNamespace(build=build), create=True):
                self.assertEqual(setup.backend_for("auto"), expected)

    def test_nvidia_takes_priority_on_a_multi_gpu_windows_machine(self):
        from types import SimpleNamespace
        with patch("setup_comfy.platform.system", return_value="Windows"), patch("setup_comfy.shutil.which", return_value="nvidia-smi"), patch("setup_comfy.subprocess.run", return_value=SimpleNamespace(returncode=0, stdout=b"GPU 0: NVIDIA")), patch("setup_comfy.windows_hardware") as amd:
            self.assertEqual(setup.backend_for("auto"), "cuda")
            amd.assert_not_called()


if __name__ == "__main__":
    unittest.main()
