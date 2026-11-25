# Exercises: Introduccio a MongoDB

## Basic Exercise

Create a collection called `students` and insert one student document with the fields `name`, `age`, and `course`.

Example document:

```javascript
{
  name: "Aina",
  age: 17,
  course: "web"
}
```

## Guided Exercise

1. Choose or create a database for practice.
2. Insert one document into the `students` collection with `insertOne`.
3. Insert another student with a different `course`.
4. Use `find()` to list all students.
5. Use `find({ course: "web" })` to show only students from the web course.

## Optional Extension

Add a field called `skills` with an array of strings, then query students who have a specific course.

## Expected Result

The collection contains at least two student documents. A query with `find()` returns all documents, and a query with a filter returns only the matching documents.

