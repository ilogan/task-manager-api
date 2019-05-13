const express = require("express");
const Task = require("../models/task");
const auth = require("../middleware/auth");

const router = new express.Router();

/*--------------------------------Tasks--------------------------------*/
//---------CREATE------------
// Create task
router.post("/tasks", auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id
  });

  // Save task
  try {
    await task.save();
    res.status(201).send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

//---------READ------------
// GET /tasks?completed=true
// GET /tasks?limit=10&skip=20
// GET /tasks?sortBy=createdAt:asc
router.get("/tasks", auth, async (req, res) => {
  try {
    const match = {};
    const sort = {};
    // completion filter logic
    if (req.query.completed) {
      match.completed = req.query.completed === "true";
    }

    // asc/desc order logic
    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(":");
      sort[parts[0]] = parts[1] === "asc" ? 1 : -1;
    }

    //get all tasks associated with authenticated user
    await req.user
      .populate({
        path: "tasks",
        match, // filter by completion
        options: {
          limit: parseInt(req.query.limit), // implement
          skip: parseInt(req.query.skip), // pagination
          sort // filter by asc/desc
        }
      })
      .execPopulate();
    res.send(req.user.tasks);
  } catch (e) {
    res.status(500).send(e);
  }
});

// Get task by id
router.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  try {
    //const task = await Task.findById(_id);
    const task = await Task.findOne({
      _id,
      owner: req.user._id
    });
    if (!task) {
      return res.status(404).send();
    }
    res.send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});

//---------UPDATE------------
router.patch("/tasks/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["description", "completed"];
  const isValidOperation = updates.every(update =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid Updates" });
  }

  try {
    // look for task with requested id and has current user as owner
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!task) {
      return res.status(404).send();
    }

    updates.forEach(update => (task[update] = req.body[update]));
    await task.save();

    res.send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});

//---------DELETE------------
router.delete("/tasks/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id
    });
    if (!task) {
      return res.status(404).send();
    }
    res.send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});

module.exports = router;
