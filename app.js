//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

// creating database
mongoose.connect("mongodb+srv://admin-mehul:test123@cluster0.buuzi.mongodb.net/toDoListDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Generating schema
const itemSchema = {
  name: String
};

// Mongoose model
const Item = mongoose.model("Item", itemSchema);

//Default items
const welcome = new Item({
  name: "Welcome to your ToDo List!!"
})
const food = new Item({
  name: "Eat"
});

// Insertion in the database
const defaultItems = [welcome, food];
const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  const day = date.getDate();

  Item.find({}, function(err, foundItems) {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully Added");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: day,
        newListItems: foundItems
      });
    }
  });

});

app.get("/:listName", function(req, res) {

  const lname = _.upperFirst(req.params.listName);


  List.findOne({
    name: lname
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        // Create New List
        const list = new List({
          name: lname,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + lname);
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });


});


app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  });
  if (listName === date.getDate()) {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function(err, foundList) {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});

app.post("/delete", function(req, res) {
  const delItem = req.body.checkedBox;
  const listName = req.body.listName;


  if (listName == date.getDate()) {
    Item.findByIdAndRemove(delItem, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully Updated!!");
        res.redirect("/");
      }
    });
  }else{
    List.findOneAndUpdate({name:listName},{$pull: {items:{_id:delItem}}},function(err,foundList){
      if(!err){
        res.redirect("/"+listName);
      }
    });
  }


});



app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
