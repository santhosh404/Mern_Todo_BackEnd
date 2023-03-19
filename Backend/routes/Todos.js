const express = require("express");
const router = express.Router();
const TodoSchema = require("../models/TodoModel");
const jwt = require('jsonwebtoken')

// Get All Todos
router.get("/", authorization, async (req, res) => {
  try {
    // const todo = await TodoSchema.find();
    const todo = await TodoSchema.find({userId:req.user.id, isCompleted: false}).sort({name:1})
    res.json(todo);
  } catch (err) {
    res.sendStatus(500).json({ message: err.message });
  }
});

//Search Todo
router.post("/searchTodo", authorization, async (req, res) => {
  try {
    var {todo} = req.body
    const filterTodo = await TodoSchema.find({name: {$regex: new RegExp(todo) }, userId: req.user.id}).sort({name:1})
    res.json({filteredTodos: filterTodo})
  }
  catch (err) {
    res.json({ status: err.message });
  }
})

// Schedule At API

router.get("/scheduled", authorization, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const scheduledAt = await TodoSchema.find({
        userId: req.user.id,
        scheduledAt: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      }
    ).sort({name:1})
    res.json(scheduledAt)

  } catch (err) {
    res.sendStatus(500).json({ message: err.message });
    // console.log(err)
  }
});

//Get completed records
router.get('/completed', authorization, async (req, res) => {
  try {
    const completedTodo = await TodoSchema.find({isCompleted: true, userId: req.user.id}).sort({name:1})
    res.json({completed: completedTodo})
  }
  catch (err) {
    res.json({status: err})
  }
})

//make item completed
router.patch('/makeCompleted/:id', getTodo, authorization, async (req, res) => {
  
  try {
    const makeCompleted = await TodoSchema.findOneAndUpdate({_id: res.todo._id,userId:req.user.id}, {isCompleted: true}, {new: true})
    res.json({"status":"moved to completed"})
  }
  catch(err) {
    res.json(err)
  }
})


// Get one Todo Item
router.get("/:id", getTodo, async (req, res) => {
  res.json(res.todo);
});

// Create Todos
router.post("/create", authorization,  async (req, res) => {
  console.log("id", req.user._id)
  const todo = new TodoSchema({
    userId: req.body.id,
    name: req.body.name,
    description: req.body.description,
    scheduledAt: req.body.scheduledAt,
    isCompleted: req.body.isCompleted
  });
  try {
    console.log(todo)
    const newTodo = await todo.save();
    res.json(newTodo);
  } catch (err) {
    res.sendStatus(400).json({ message: err.message });
  }
});

// Update Todos
router.patch("/:id", getTodo, async (req, res) => {
  if (req.body.name != null) res.todo.name = req.body.name;
  if (req.body.description != null) res.todo.description = req.body.description;
  if (req.body.scheduledAt != null) res.todo.description = req.body.scheduledAt;
  if (req.body.isCompleted != null) res.todo.isCompleted = req.body.isCompleted;
  try {
    const updatedTodo = await res.todo.save();
    res.json(updatedTodo);
  } catch (err) {
    res.sendStatus(400).json({ Message: err.message });
  }
});

// Delete Todos
router.delete("/:id", getTodo, async (req, res) => {
  try {
    await res.todo.remove();
    res.json({ Message: "Deleted." });
  } catch (err) {
    res.sendStatus(400).json({ Message: err.message });
  }
});

async function getTodo(req, res, next) {
  let getSingleTodo;
  try {
    getSingleTodo = await TodoSchema.findById(req.params.id);
    if (getSingleTodo == null)
      return res.sendStatus(404).json({ Message: "Item Not Found" });
  } catch (err) {
    res.sendStatus(404).json({ Message: err.message });
  }
  res.todo = getSingleTodo;
  next();
}


async function authorization(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(" ")[1]
  console.log("tokens",token)
  if(token==null) return res.sendStatus(401).json({status: "UnAuthorized"})
  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
    if(err) return res.json({status: "Invalid Token!"})
    req.user = user
    next()
  })

}

module.exports = router;
