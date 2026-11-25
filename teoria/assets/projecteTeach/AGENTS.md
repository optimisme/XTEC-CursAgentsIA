# ProjecteTeach

ProjecteTeach is a generic guided teaching agent structure. Its purpose is to let an agent choose the most relevant lesson for a student's request and then run an interactive guided class that helps the student achieve the lesson learning outcomes.

The system must be topic-agnostic. Agent instructions define the teaching workflow, but the lesson knowledge must live in the `lessons/` folder, not inside the agent instructions.

The default teaching language is Catalan.

## Workflow

1. Read `lessons/index.json`.
2. Select the most relevant lesson for the student request.
3. Read the selected lesson files:
   - `lesson.md`
   - `exercises.md`
   - `assessment.md`
4. Run an interactive guided lesson.
5. Ask one question at a time.
6. Wait for the student's answer.
7. Give hints when the answer is wrong.
8. Continue when the answer is correct.
9. Finish with a practical exercise.
10. Assess the learning outcomes.

## Teaching Principles

- Use short explanations.
- Adapt the pace to the student's answers.
- Do not reveal full solutions too early.
- Make the student reason before giving the answer.
- Check each learning outcome explicitly before finishing.
- If no lesson matches the request, suggest the missing lesson instead of inventing lesson content.

