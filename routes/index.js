const router = require("express").Router();

// const authRoutes = require("./auth");
// const userRoutes = require("./user");
// const addressRoutes = require("./address");
// const newsletterRoutes = require("./newsletter");
// const productRoutes = require("./product");
// const categoryRoutes = require("./category");
// const brandRoutes = require("./brand");
// const contactRoutes = require("./contact");
// const merchantRoutes = require("./merchant");
// const cartRoutes = require("./cart");
// const orderRoutes = require("./order");
// const reviewRoutes = require("./review");
// const wishlistRoutes = require("./wishlist");

// ==========================================================================
const usersRouter = require("./user.route");
const accountRouter = require("./accounts.route");
const servicesRouter = require("./services.route");
const walletRouter = require("./wallet.route");
const walletTransactionRouter = require("./walletTransaction.route");
const bankRouter = require("./banks.route");
const bankAccountRouter = require("./bankAccounts.route");
const bannerRouter = require("./banners.route");
const tickerRouter = require("./ticker.route");
const referralRouter = require("./referral.route");
const contactUsRouter = require("./contactUs.route");
const supportsRouter = require("./support.route");
const subSupportRouter = require("./subSupport.route");
const myBannerRouter = require("./banner.route");
const stateRouter = require("./states.route");
const ambikaSlabRouter = require("./ambikaSlab.route");
const mlanRouter = require("./mplan.route");
const companyRouter = require("./company.route");
const apisRouter = require("./apis.route");
const rechargeRouter = require("./recharge.route");
const transactionRouter = require("./transaction.route");
const paymentModeRouter = require("./paymentModes.route");
const serviceDiscountRouter = require("./serviceDiscount.route");
const spSlabRouter = require("./slabs.route");
const cashbackRouter = require("./cashback.route");
const adminLoyaltyRouter = require("./adminLoyalty.route");

// ==========================================================================

// // auth routes
// router.use("/auth", authRoutes);

// // user routes
// router.use("/user", userRoutes);

// // address routes
// router.use("/address", addressRoutes);

// // newsletter routes
// router.use("/newsletter", newsletterRoutes);

// // product routes
// router.use("/product", productRoutes);

// // category routes
// router.use("/category", categoryRoutes);

// // brand routes
// router.use("/brand", brandRoutes);

// // contact routes
// router.use("/contact", contactRoutes);

// // merchant routes
// router.use("/merchant", merchantRoutes);

// // cart routes
// router.use("/cart", cartRoutes);

// // order routes
// router.use("/order", orderRoutes);

// // Review routes
// router.use("/review", reviewRoutes);

// // Wishlist routes
// router.use("/wishlist", wishlistRoutes);

// =================================================================
router.use("/users", usersRouter);
router.use("/auth", accountRouter);
router.use("/service", servicesRouter);
router.use("/ambikaSlab", ambikaSlabRouter);
router.use("/wallet", walletRouter);
router.use("/walletTransaction", walletTransactionRouter);
router.use("/transaction", transactionRouter);
router.use("/bank", bankRouter);
router.use("/bankAccount", bankAccountRouter);
router.use("/banner", bannerRouter);
router.use("/ticker", tickerRouter);
router.use("/referral", referralRouter);
router.use("/contactUs", contactUsRouter);
router.use("/support", supportsRouter);
router.use("/subSupport", subSupportRouter);
router.use("/mlan", mlanRouter);
router.use("/company", companyRouter);
router.use("/myBanner", myBannerRouter);
router.use("/state", stateRouter);
router.use("/apis", apisRouter);
router.use("/rechargeOrBill", rechargeRouter);
router.use("/paymentMode", paymentModeRouter);
router.use("/discount", serviceDiscountRouter);
router.use("/spslabs", spSlabRouter);
router.use("/cashback", cashbackRouter);
router.use("/adminLoyalty", adminLoyaltyRouter);

// =================================================================

module.exports = router;
