const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer = require("multer"); //used for form data parsing like images
const {storage} = require("../cloudConfig.js");
// const upload = multer({dest : 'uploads/'});  
const upload = multer({storage});  
// const validateListing = (req,res,next)=>{
//      let error = listingSchema.validate(req.body);
//     if(error){
//         let errMsg = error.details.map((el)=>el.message).join(",");
//         throw new ExpressError(400,errMsg);
//     }else{
//         next();
//     }
// }
router
  .route("/") // Index Route
  .get(wrapAsync(listingController.index))
  .post(
    //create new route
    isLoggedIn,
    upload.single('listing[image]'),
    validateListing,
    
    wrapAsync(listingController.createListing)
  );  

//New Route
//  : Note : This get requrest we have placed before show route because , if we place show route before then it will treate /new as it is a id...
router.get("/new", isLoggedIn, listingController.renderNewForm);

router
  .route("/:id") //show route
  .get(wrapAsync(listingController.showListings))
  .put(
    //update route
    isLoggedIn,
    isOwner,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.updateListing)
  )
  .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));

//Edit Route
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.renderEditForm)
);

module.exports = router;
