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
const usersRouter = require("./user.controller");
const accountRouter = require("./accounts.controller");
const servicesRouter = require("./services.controller");
const walletRouter = require("./wallet.controller");
const walletTransactionRouter = require("./walletTransaction.controller");
const bankRouter = require("./banks.controller");
const bankAccountRouter = require("./bankAccounts.controller");
const bannerRouter = require("./banners.controller");
const tickerRouter = require("./ticker.controller");
const referralRouter = require("./referral.controller");
const contactUsRouter = require("./contactUs.controller");
const supportsRouter = require("./support.controller");
const subSupportRouter = require("./subSupport.controller");
const myBannerRouter = require("./banner.controller");
const stateRouter = require("./states.controller");
const ambikaSlabRouter = require("./ambikaSlab.controller");
const mlanRouter = require("./mplan.controller");
const companyRouter = require("./company.controller");
const apisRouter = require("./apis.controller");
const rechargeRouter = require("./recharge.controller");
const transactionRouter = require("./transaction.controller");
const paymentModeRouter = require("./paymentModes.controller");
const serviceDiscountRouter = require("./serviceDiscount.controller");

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

// =================================================================

module.exports = router;
