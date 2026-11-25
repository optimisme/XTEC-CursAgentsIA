# Introduccio a MongoDB

## Level

Beginner

## Estimated Duration

50 minutes

## Learning Outcomes

- Explain what MongoDB is and how it differs from a relational database.
- Identify databases, collections, and documents.
- Insert a simple document with `insertOne`.
- Query documents with `find` and a basic filter.

## Prior Knowledge

- Basic idea of a database.
- Basic understanding of structured data.
- Basic JavaScript object notation is helpful but not required.

## Key Concepts

- MongoDB: a NoSQL document database.
- Database: a container for collections.
- Collection: a group of related documents.
- Document: a JSON-like record stored in a collection.
- Field: a named value inside a document.
- `insertOne`: adds one document to a collection.
- `find`: reads documents from a collection.
- Filter: an object that describes which documents to return.

## Guided Explanation Steps

1. Start by comparing a relational table with a MongoDB collection.
2. Explain that MongoDB stores documents instead of rows.
3. Show a simple document with fields such as `name`, `age`, and `course`.
4. Explain that related documents are grouped in a collection.
5. Insert one document with `insertOne`.
6. Read all documents with `find()`.
7. Add a simple filter, such as `{ course: "web" }`.
8. Connect the commands to a small example collection called `students`.

## Checking Questions

- What is a document in MongoDB?
- What is the difference between a collection and a database?
- What does `insertOne` do?
- What does the filter in `find({ course: "web" })` mean?

## Common Mistakes

- Thinking that a collection must have fixed columns like a SQL table.
- Confusing a database with a collection.
- Forgetting that filters are written as objects.
- Using invalid object syntax in queries.
- Expecting `find()` with no filter to return only one document.

