const productModel = require('../models/productModel')
const { uploadFile } = require("../aws/aws");
const { isValidObjectId } = require('mongoose');




//----------------------------------- Create Product by ID API ---------------------------------//

const createproduct = async (req, res) => {
    try {
        const data = req.body
        let files = req.files;
        let arrOfKeys = Object.keys(data)
        if (arrOfKeys.length == 0) { return res.status(400).send({ status: false, msg: "Please enter your details" }) }

        for (let i = 0; i < arrOfKeys.length; i++) {
            data[arrOfKeys[i]] = data[arrOfKeys[i]].trim()
        }

        let { title, description, price, currencyId, currencyFormat, style, availableSizes, installments } = data

        if (!title || typeof (title) != "string") { return res.status(400).send({ status: false, message: "Enter Title !" }) }
        let unoqeTitle = await productModel.find({ title: title })
        if (unoqeTitle.length != 0) { return res.status(400).send({ status: false, message: "Enter Unique Title !" }) }

        if (!description) { return res.status(400).send({ status: false, message: "Enter description !" }) }

        if (!price) { return res.status(400).send({ status: false, message: "Enter price !" }) }
        if (!/^\d{0,8}[.]?\d{1,4}$/.test(price)) { return res.status(400).send({ status: false, message: "Enter Valid Price !" }) }

        if (!currencyId) { return res.status(400).send({ status: false, message: "Enter Currency id !" }) }
        if (currencyId != "INR") { return res.status(400).send({ status: false, message: "Currency Should be INR !" }) }

        if (!currencyFormat) { return res.status(400).send({ status: false, message: "Enter Currency Format !" }) }
        if (currencyFormat != "₹") { return res.status(400).send({ status: false, message: "Invalid currency Format !" }) }

        if (files.length == 0) { return res.status(400).send({ status: false, msg: "Please upload productImage !" }) }

        let productImage = await uploadFile(files[0])
        data.productImage = productImage

        if (!style) { return res.status(400).send({ status: false, message: "Enter style !" }) }
        if (!availableSizes) { return res.status(400).send({ status: false, message: "enter required size !" }) }

        data.availableSizes = data.availableSizes.split(",")
        availableSizes = data.availableSizes

        const enums = productModel.schema.obj.availableSizes.enum
        let newSizes = []
        for (let i = 0; i < availableSizes.length; i++) {
            let yesNo = (enums.includes(availableSizes[i].trim())) ? true : false
            if (!yesNo) { return res.status(400).send({ status: false, message: "Please enter valid size !" }) }
            else { newSizes.push(availableSizes[i].trim()) }
        }
        data.availableSizes = newSizes

        if (!/^\d+(\.\d{2})?$/.test(installments)) { return res.status(400).send({ status: false, message: "Please enter valid installments !" }) }

        const result = await productModel.create(data)
        res.status(201).send({ status: true, message: "Success", data: result })

    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }
}




//----------------------------------- Get Product API ------------------------------------//

const getProduct = async (req, res) => {
    try {
        let data = req.query;

        let options = { isDeleted: false }

        if (data.size) {
            let enums = productModel.schema.obj.availableSizes.enum
            if (!enums.includes(data.size.toUpperCase())) { return res.status(400).send({ status: false, message: "Please enter valid size !" }) }
            options.availableSizes = data.size.toUpperCase()
        }
        if (data.name) { options.title = { $regex: data.name, $options: "i" } }

        if (data.priceGretherThen || data.priceLessThan) {

            if (!/^[-+]?[0-9]*\.?[0-9]*$/.test(data.priceLessThan) || !/^[-+]?[0-9]*\.?[0-9]*$/.test(data.priceGretherThen)) { return res.status(400).send({ status: false, message: "Enter Valid Price !" }) }

            if (data.priceGretherThen && data.priceLessThan) { options.price = { $gt: data.priceGretherThen, $lt: data.priceLessThan } }
            else if (data.priceGretherThen) { options.price = { $gt: data.priceGretherThen } }
            else { options.price = { $lt: data.priceLessThan } }
        }

        let sortObj = {}
        if (data.priceSort) {
            if (data.priceSort == 1 || data.priceSort == -1) { sortObj.price = data.priceSort }
            else { return res.status(400).send({ status: false, message: "Please enter priceSort value 1 or -1 only !" }) }
        }

        let result = await productModel.find(options).sort(sortObj)
        if (result.length == 0) { return res.status(404).send({ status: false, message: "No product found !" }) }

        return res.status(200).send({ status: true, message: "Success", count: result.length, data: result })

    } catch (err) {
        return res.status(500).send(err.message)
    }
}




//----------------------------------- Get Product by ID API ---------------------------------//

const getProductById = async (req, res) => {
    try {
        let productId = req.params.productId

        if (!isValidObjectId(productId))return res.status(400).send({ status: false, message: 'Invalid ProductId !' })

        let product = await productModel.findById({ _id: productId, isDeleted: false })
        if (!product) return res.status(404).send({ status: false, message: "Product not found !" })

        return res.status(200).send({ status: true, message: "Success", data: product })

    } catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}




//----------------------------------- Update Product API ------------------------------------//

const updateProduct = async (req, res) => {
    try {
        let productId = req.params.productId
        let data = req.body
        let files = req.files;

        if (!productId) { return res.status(400).send({ status: false, msg: "productId is Must for Update data" }) }
        if (!isValidObjectId(productId)) { return res.status(400).send({ status: false, msg: "productId should be valid" }) }

        let product = await productModel.find({ _id: productId, isDeleted: false })
        if (product.length == 0) { return res.status(404).send({ status: false, msg: "product not found" }) }

        let arrOfKeys = Object.keys(data)
        if (arrOfKeys.length == 0) { return res.status(400).send({ status: false, msg: "Please enter your details for Update" }) }

        for (let i = 0; i < arrOfKeys.length; i++) {
            data[arrOfKeys[i]] = data[arrOfKeys[i]].trim()
        }

        let { title, price, currencyId, currencyFormat, availableSizes, installments, } = data

        if (title) {
            let unoqeTitle = await productModel.find({ title: title })
            if (unoqeTitle.length != 0) { return res.status(400).send({ status: false, message: "Enter Unique Title!" }) }
        }

        if (price) { if (!/^\d{0,8}[.]?\d{1,4}$/.test(price)) { return res.status(400).send({ status: false, message: "Enter Valid Price" }) } }

        if (currencyId) { if (currencyId != "INR") { return res.status(400).send({ status: false, message: "Currency Should be INR" }) } }

        if (currencyFormat) { if (currencyFormat != "₹") { return res.status(400).send({ status: false, message: "Invalid currency Format" }) } }

        data.availableSizes = JSON.parse(data.availableSizes)
        if (availableSizes) {
            const enums = productModel.schema.obj.availableSizes.enum
            for (let i = 0; i < availableSizes.length; i++) {
                let yesNo = (enums.includes(availableSizes[i])) ? true : false
                if (!yesNo) {
                    return res.status(400).send({ status: false, message: "Please enter valid size" })
                }
            }
        }

        if (installments) {
            if (!/^\d{0,8}[.]?\d{1,4}$/.test(installments)) { return res.status(400).send({ status: false, message: "Installement Should be number" }) }
        }

        if (files && files.length > 0) {
            let profileImgUrl = await uploadFile(files[0]);
            data.productImage = profileImgUrl;
        }

        let updateProduct = await productModel.findOneAndUpdate({ _id: productId }, data, { new: true })
        res.status(200).send({ status: true, message: "Product just updated", data: updateProduct });

    }
    catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}





//----------------------------------- Delete Product API ---------------------------------//

const deleteProduct = async (req, res) => {
    try {
        let productId = req.params.productId

        if (!isValidObjectId(productId))return res.status(400).send({ status: false, message: " Invalid ProductId !" })
        let product = await productModel.findById({ _id: productId})
        if (!product) return res.status(404).send({ status: false, message: "Product not found !" })
        if(product.isDeleted){return res.status(400).send({ status: false, message: "Product alredy deleted !" })}

        await productModel.updateOne({ _id: productId}, { isDeleted: true, deletedAt: Date.now() })
        
        res.status(200).send({ status: true, message: "Product deleted successfully." })

    } catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}




module.exports = { createproduct, getProduct, getProductById, updateProduct, deleteProduct }