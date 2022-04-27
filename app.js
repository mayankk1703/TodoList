
const express = require("express");
const bodyParser = require("body-parser");
const _ =require("lodash");
const mongoose=require("mongoose");

mongoose.connect("mongodb://mayankk1703:mayank123@cluster0-shard-00-00.zm7b0.mongodb.net:27017,cluster0-shard-00-01.zm7b0.mongodb.net:27017,cluster0-shard-00-02.zm7b0.mongodb.net:27017/myFirstDatabase?ssl=true&replicaSet=atlas-9p4ew3-shard-0&authSource=admin&retryWrites=true&w=majority",{useNewUrlParser:true});

const itemsSchema={
  name:String
};
const Item=mongoose.model("Item",itemsSchema);
const item1=new Item({
  name:"Welcome to your todo list"
});
const item2=new Item({
  name:"Hit the + button to add a new item"
});
const item3=new Item({
  name:"<-- Hit this to delete an item"
});
const defaultitems=[item1,item2,item3];

const listschema={
  name:String,
  items:[itemsSchema]
};
const List=mongoose.model("List",listschema);


const app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine','ejs');
app.use(express.static("public"));

app.get("/", function(req, res){
    
    Item.find({},function(err,founditems){
      if(founditems.length===0){
        Item.insertMany(defaultitems,function(err){
          if(err) console.log(err);
          else console.log("Successfully saved default items to DB");
        });
      }
      res.render("list",{listtitle:"Today",newlistItems:founditems });
    });
   
});
app.get("/:customListName",function(req,res){
  customListName=_.capitalize(req.params.customListName) ;
  List.findOne({name:customListName},function(err,foundlist){
    if(!err)
    {
      if(!foundlist){
        //Create a new list

          const list= new List({
            name:customListName,
            items:defaultitems
          });
          list.save();
          res.redirect("/"+customListName);
      } 
      else{
        //Show an existing list
        if(foundlist.items.length===0){
            foundlist.items.push(item1);
            foundlist.items.push(item2);
            foundlist.items.push(item3);
            foundlist.save();
        }
        res.render("list",{listtitle:foundlist.name,newlistItems:foundlist.items});
      }
    }
  });
});
app.post("/",function(req,res){
   var itemname=req.body.newItem;
   var listname=req.body.list;
   const item=new Item({
     name:itemname
   });
   if(listname==="Today"){
    item.save(); 
    res.redirect("/");
   }
   else{
     List.findOne({name:listname},function(err,foundlist){
       foundlist.items.push(item);
       foundlist.save();
       res.redirect("/"+listname);
     });
     
   }
    
});
app.post("/delete",function(req,res){
  const checkboxid=req.body.checkbox;
  const listname=req.body.listname;

  if(listname==="Today"){
    Item.findByIdAndRemove(checkboxid,function(err){
      if(!err){
         console.log("deleted successfully");
         res.redirect("/");
       }
    });
    
  }
  else{
    List.findOneAndUpdate({name:listname},{$pull:{items:{_id:checkboxid}}},function(err,foundlist){
      if(!err)
      {
        res.redirect("/"+listname);
      }
      else console.log(err);
    });
  }
  
});



app.listen(3000, function(){
  console.log("Server started on port 3000.");
});
