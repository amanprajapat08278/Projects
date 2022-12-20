const express = require("express")
const router = express.Router()
const userController = require("../controllers/userController")
const productController = require("../controllers/productController")
const auth = require("../middleware/auth")

router.post("/register", userController.createUser)

router.post("/login", userController.loginUser)

router.get("/user/:userId/profile", auth.authentication, userController.getUser)

router.put("/user/:userId/profile", auth.authentication, auth.authorisation, userController.updateUser)

router.post("/products", productController.createproduct)

router.get("/products", productController.getProduct)

router.get("/products/:productId", productController.getProductById)


router.all("/**", (req, res)=>{
    res.status(400).send({status:false, message:"Route is wrong"})
})
module.exports = router