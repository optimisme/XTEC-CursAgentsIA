from __future__ import annotations

import gc
import io
import json
import math
import re
import subprocess
import tempfile
import uuid
import wave
from pathlib import Path

import numpy as np
import torch
from PIL import Image
import folder_paths

CATEGORY = "Classroom"
VOICES = ["en_US-lessac-medium", "en_US-ryan-medium"]


def output_file(suffix):
    directory = Path(folder_paths.get_output_directory()) / "classroom"
    directory.mkdir(parents=True, exist_ok=True)
    return directory / (uuid.uuid4().hex[:12] + suffix)


def text_result(text):
    path = output_file(".txt")
    path.write_text(text, encoding="utf-8")
    return {"ui": {"text": [text], "saved": [str(path)]}, "result": (text,)}


class ClassroomText:
    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {"text": ("STRING", {"multiline": True, "default": ""})}}

    RETURN_TYPES = ("STRING",)
    FUNCTION = "run"
    CATEGORY = CATEGORY

    def run(self, text):
        return (text,)


class ClassroomShowText:
    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {"text": ("STRING", {"forceInput": True})}}

    RETURN_TYPES = ("STRING",)
    FUNCTION = "run"
    CATEGORY = CATEGORY
    OUTPUT_NODE = True

    def run(self, text):
        return text_result(text)


class ClassroomGenerateText:
    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {
            "source_text": ("STRING", {"forceInput": True}),
            "instruction": ("STRING", {"multiline": True, "default": "Write a short explanation in English."}),
            "max_new_tokens": ("INT", {"default": 600, "min": 64, "max": 2048}),
            "seed": ("INT", {"default": 42, "min": 0, "max": 2147483647, "control_after_generate": True}),
        }}

    RETURN_TYPES = ("STRING",)
    FUNCTION = "run"
    CATEGORY = CATEGORY

    def run(self, source_text, instruction, max_new_tokens, seed):
        from transformers import AutoModelForCausalLM, AutoTokenizer, StoppingCriteria, StoppingCriteriaList
        import comfy.model_management as mm

        path = Path(folder_paths.models_dir) / "text_generation" / "Qwen3-1.7B"
        if not (path / "config.json").exists():
            raise ValueError("Qwen3-1.7B is missing. Run the classroom installer without --skip-production.")
        mm.throw_exception_if_processing_interrupted()
        # This node uses system RAM, leaving GPU VRAM for image generation.
        tokenizer = AutoTokenizer.from_pretrained(path, local_files_only=True)
        model = AutoModelForCausalLM.from_pretrained(path, torch_dtype=torch.float32, local_files_only=True)
        model.eval()

        class CheckInterrupt(StoppingCriteria):
            def __call__(self, input_ids, scores, **kwargs):
                mm.throw_exception_if_processing_interrupted()
                return False

        try:
            messages = [{"role": "system", "content": instruction}, {"role": "user", "content": source_text}]
            text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True, enable_thinking=False)
            inputs = tokenizer(text, return_tensors="pt")
            if inputs.input_ids.shape[-1] > 6000:
                raise ValueError("Use a shorter classroom brief (at most 6000 input tokens).")
            with torch.random.fork_rng(devices=[]), torch.inference_mode():
                torch.manual_seed(seed)
                result = model.generate(**inputs, max_new_tokens=max_new_tokens,
                                        do_sample=True, temperature=0.7, top_p=0.8, top_k=20,
                                        stopping_criteria=StoppingCriteriaList([CheckInterrupt()]))
            generated = result[0, inputs.input_ids.shape[-1]:]
            if len(generated) >= max_new_tokens and int(generated[-1]) != tokenizer.eos_token_id:
                raise ValueError("Text reached the token limit. Increase max_new_tokens or request a shorter answer.")
            answer = tokenizer.decode(generated, skip_special_tokens=True).strip()
            if not answer:
                raise ValueError("The text model returned an empty answer. Change the seed and retry.")
            return (answer,)
        finally:
            del model
            gc.collect()


def parse_scene_plan(text):
    """Accept JSON or a plan missing only its final object brace; never invent scenes."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.I)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        plan = json.loads(cleaned)
    except json.JSONDecodeError as error:
        # Qwen sometimes closes the complete scenes array but omits the root }.
        # Only recover an EOF error after that array; do not repair scene text.
        if error.pos == len(cleaned) and cleaned.startswith("{") and cleaned.endswith("]"):
            try:
                plan = json.loads(cleaned + "}")
            except json.JSONDecodeError:
                raise ValueError("Scene plan must be valid JSON. Review the text output; use the reviewed example or change the seed.") from error
        else:
            raise ValueError(
                f"Scene plan must be valid JSON ({error.msg}, line {error.lineno}, column {error.colno}). "
                "Review the text output; use the reviewed example or change the seed."
            ) from error
    scenes = plan.get("scenes") if isinstance(plan, dict) else None
    if not isinstance(scenes, list) or len(scenes) != 3:
        raise ValueError("The scene plan must contain exactly three scenes.")
    for scene in scenes:
        if not isinstance(scene, dict):
            raise ValueError("Every scene must be an object with narration and image_prompt.")
        for key in ("narration", "image_prompt"):
            if not isinstance(scene.get(key), str) or not scene[key].strip():
                raise ValueError(f"Every scene needs a non-empty {key} string.")
        if len(scene["narration"]) > 1800:
            raise ValueError("Keep each scene under 1800 characters for this short demonstration.")
    return scenes


class ClassroomScenes:
    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {"plan": ("STRING", {"forceInput": True})}}

    RETURN_TYPES = ("STRING",) * 6
    RETURN_NAMES = ("narration_1", "image_prompt_1", "narration_2", "image_prompt_2", "narration_3", "image_prompt_3")
    FUNCTION = "run"
    CATEGORY = CATEGORY

    def run(self, plan):
        scenes = parse_scene_plan(plan)
        return tuple(value for s in scenes for value in (s["narration"], s["image_prompt"]))


class ClassroomPiper:
    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {
            "text": ("STRING", {"multiline": True, "default": "A workflow connects small tasks to create a useful result."}),
            "voice": (VOICES,),
            "speed": ("FLOAT", {"default": 1.0, "min": 0.5, "max": 2.0, "step": 0.05}),
        }}

    RETURN_TYPES = ("AUDIO",)
    FUNCTION = "run"
    CATEGORY = CATEGORY

    def run(self, text, voice, speed):
        from piper import PiperVoice, SynthesisConfig
        if voice not in VOICES:
            raise ValueError("Choose one of the installed English voices.")
        if not text.strip() or len(text) > 6000:
            raise ValueError("Use between 1 and 6000 characters for this voice exercise.")
        path = Path(folder_paths.models_dir) / "piper" / f"{voice}.onnx"
        if not path.exists() or not Path(str(path) + ".json").exists():
            raise ValueError(f"Missing Piper voice/config: {path}. Run the classroom installer.")
        model = PiperVoice.load(str(path), use_cuda=False)
        buffer = io.BytesIO()
        with wave.open(buffer, "wb") as wav:
            model.synthesize_wav(text, wav, syn_config=SynthesisConfig(length_scale=1.0 / speed))
        buffer.seek(0)
        with wave.open(buffer, "rb") as wav:
            rate = wav.getframerate()
            samples = np.frombuffer(wav.readframes(wav.getnframes()), dtype="<i2").copy()
        if samples.size == 0:
            raise ValueError("Piper returned no audio. Check the input text.")
        return ({"waveform": torch.from_numpy(samples).float().reshape(1, 1, -1) / 32768.0,
                 "sample_rate": rate},)


def write_wav(audio, path):
    waveform = audio["waveform"].detach().cpu().float()
    if waveform.ndim != 3 or waveform.shape[0] != 1 or waveform.shape[1] not in (1, 2) or waveform.shape[2] == 0:
        raise ValueError("Expected one non-empty mono or stereo audio clip.")
    if not torch.isfinite(waveform).all():
        raise ValueError("Audio contains non-finite samples.")
    rate = int(audio["sample_rate"])
    if not 8000 <= rate <= 192000:
        raise ValueError("Unsupported audio sample rate.")
    samples = (waveform[0].T.clamp(-1, 1).numpy() * 32767).astype("<i2")
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(samples.shape[1])
        wav.setsampwidth(2)
        wav.setframerate(rate)
        wav.writeframes(samples.tobytes())
    return samples.shape[0] / rate


class ClassroomSaveWav:
    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {"audio": ("AUDIO",)}}

    RETURN_TYPES = ("AUDIO",)
    FUNCTION = "run"
    CATEGORY = CATEGORY
    OUTPUT_NODE = True

    def run(self, audio):
        path = output_file(".wav")
        write_wav(audio, path)
        return {"ui": {"audio": [{"filename": path.name, "subfolder": "classroom", "type": "output"}],
                        "text": [str(path)]}, "result": (audio,)}


class ClassroomComposeVideo:
    @classmethod
    def INPUT_TYPES(cls):
        required = {}
        for i in range(1, 4):
            required[f"image_{i}"] = ("IMAGE",)
            required[f"audio_{i}"] = ("AUDIO",)
        required["fps"] = ("INT", {"default": 24, "min": 12, "max": 30})
        return {"required": required}

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("video_path",)
    FUNCTION = "run"
    CATEGORY = CATEGORY
    OUTPUT_NODE = True

    def run(self, fps, **kwargs):
        import imageio_ffmpeg
        import comfy.model_management as mm
        ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
        path = output_file(".mp4")
        manifest = []
        with tempfile.TemporaryDirectory(prefix="comfy-classroom-") as temporary:
            root = Path(temporary)
            args = [ffmpeg, "-hide_banner", "-loglevel", "error", "-y"]
            filters = []
            elapsed = 0.0
            for i in range(1, 4):
                image = kwargs[f"image_{i}"]
                if image.ndim != 4 or image.shape[0] != 1 or image.shape[-1] not in (3, 4):
                    raise ValueError("Each scene requires a single RGB image (batch_size = 1).")
                array = (image[0, :, :, :3].detach().cpu().clamp(0, 1).numpy() * 255).astype(np.uint8)
                Image.fromarray(array).save(root / f"scene{i}.png")
                duration = write_wav(kwargs[f"audio_{i}"], root / f"scene{i}.wav")
                if duration > 120:
                    raise ValueError("Keep each classroom scene below two minutes.")
                # Align scene boundaries to frames; pad at most 1/fps seconds of silence.
                duration = math.ceil(duration * fps) / fps
                args += ["-loop", "1", "-framerate", str(fps), "-i", str(root / f"scene{i}.png"),
                         "-i", str(root / f"scene{i}.wav")]
                video_index, audio_index = 2 * (i - 1), 2 * (i - 1) + 1
                filters += [f"[{video_index}:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1,trim=duration={duration},setpts=PTS-STARTPTS[v{i}]",
                            f"[{audio_index}:a]aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,apad,atrim=duration={duration},asetpts=PTS-STARTPTS[a{i}]"]
                manifest.append({"scene": i, "start": elapsed, "duration": duration})
                elapsed += duration
            filters.append("[v1][a1][v2][a2][v3][a3]concat=n=3:v=1:a=1[v][a]")
            args += ["-filter_complex_threads", "1", "-filter_complex", ";".join(filters), "-map", "[v]", "-map", "[a]",
                     "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
                     "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", str(path)]
            mm.throw_exception_if_processing_interrupted()
            # stderr goes to disk so a full pipe cannot deadlock a long render.
            with (root / "ffmpeg.log").open("w+") as log:
                process = subprocess.Popen(args, stdout=subprocess.DEVNULL, stderr=log)
                try:
                    while True:
                        try:
                            status = process.wait(timeout=0.5)
                            break
                        except subprocess.TimeoutExpired:
                            mm.throw_exception_if_processing_interrupted()
                    if status:
                        log.seek(0)
                        raise RuntimeError("Video composition failed: " + log.read()[-4000:])
                except BaseException:
                    process.kill()
                    process.wait()
                    path.unlink(missing_ok=True)
                    raise
        path.with_suffix(".timeline.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
        return {"ui": {"text": [str(path)], "classroom_video": [path.name]}, "result": (str(path),)}


NODE_CLASS_MAPPINGS = {cls.__name__: cls for cls in (ClassroomText, ClassroomShowText, ClassroomGenerateText,
                        ClassroomScenes, ClassroomPiper, ClassroomSaveWav, ClassroomComposeVideo)}
NODE_DISPLAY_NAME_MAPPINGS = {
    "ClassroomText": "Text / original brief",
    "ClassroomShowText": "Review and save text",
    "ClassroomGenerateText": "Generate text (local Qwen)",
    "ClassroomScenes": "Read three-scene plan",
    "ClassroomPiper": "Text to voice (Piper)",
    "ClassroomSaveWav": "Save narration (WAV)",
    "ClassroomComposeVideo": "Compose three scenes (MP4)",
}
