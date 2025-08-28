const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
const { listingSchema, reviewSchema } = require("./schema.js");
const ExpressError = require("./utils/ExpressError.js");

module.exports.isLoggedIn = (req, res, next) => {
  req.session.redirectUrl = req.originalUrl; // it conntains the url to which we want to redirect
  if (!req.isAuthenticated()) {
    req.flash("error", "you must be logged in to create listing");
    return res.redirect("/login");
  }
  next();
}

module.exports.saveRedirectedUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  } else {
    res.locals.redirectUrl = "/listings"; // fallback
  }
  next();
};


module.exports.isOwner =async (req, res, next) => {
   let { id } = req.params;
    let listing = await Listing.findById(id);
    if(!listing.owner._id.equals(res.locals.currUser._id)){
      req.flash("error","You are not the owner of the listing");
      return res.redirect(`/listings/${id}`);
    }
    next();
};

module.exports.validateListing = (req, res, next) => {
  // Destructure 'error' and 'value' directly from the validation result
  const { error, value } = listingSchema.validate(req.body);

  if (error) {
    // Now, 'error' here will ONLY be defined if validation truly failed
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    // Validation succeended
    // Optional: you can use 'value' here if you need the validated/coerced data
    // req.body.listing = value.listing; // If you want to replace original body with validated data
    next();
  }
};

module.exports.validateReview = (req, res, next) => {
  const { error, value } = reviewSchema.validate(req.body);

  if (error) {
    // Check if error.details exists and is an array
    if (error.details && Array.isArray(error.details)) {
      const errMsg = error.details.map((el) => el.message).join(", ");
      return next(new ExpressError(400, errMsg));
    } else {
      // Fallback for unexpected error structures
      // This part will execute if error.details is undefined, null, or not an array
      console.error("Unexpected validation error structure:", error);
      return next(
        new ExpressError(
          400,
          "Validation failed: Invalid input data. Please check your request."
        )
      );
    }
  }
  next();
};

module.exports.isReviewAuthor =async (req, res, next) => {
   let { id, reviewId } = req.params;
    let review = await Review.findById(reviewId);
    if(!review.author.equals(res.locals.currUser._id)){
      req.flash("error","You are not the author of this review");
      return res.redirect(`/listings/${id}`);
    }
    next();
};
