const express = require('express');
const router = express.Router({ mergeParams: true });
const wrapAsync = require('../utils/WrapAsync.js');
const {isLoggedIn,validateReviews,isReviewAuther} = require('../middleware.js');

const reviewController = require("../controllers/review.js");

// Reviews

router.post("/", isLoggedIn, validateReviews, wrapAsync(reviewController.createReview));

// delete review route
router.delete("/:reviewId", isLoggedIn,isReviewAuther, wrapAsync(reviewController.destroyReview));

module.exports = router;