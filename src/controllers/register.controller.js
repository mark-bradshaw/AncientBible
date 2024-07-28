const { checkEmailAvailability, createUser } = require('../models/register.model')
const { sendVerificationEmail } = require("../models/verifyEmail.model");
const { defaultRender } = require('../utils/defaultValues')

/**
 *
 * @param {any} req
 * @param {any} res
 * @returns {Promise<any>}
 */
const registerUser = async (req, res) => {

    let { name, email, password, password2 } = req.body;
    let errors = [];

    // Checks if user information contains any of these errors
    if (!name || !email || !password || !password2) {
        errors.push({ message: "Please enter all fields." });
    }
    if (password.length < 8) {
        errors.push({
            message: "password should be at least 8 characters long.",
        });
    }
    if (password !== password2) {
        errors.push({ message: "passwords must match." });
    }
    if (errors.length > 0) {
        await defaultRender(req, res, false, "../public/views/register", { errors });
    }

    try {

        // Checks if user already exists
        const users = await checkEmailAvailability(email);
        if (users.length > 0) {
            errors.push({ message: "User with this email already exists" });
            return await defaultRender(req, res, false, "../public/views/register", { errors });
        }

        // Creates user
        const newUser = await createUser(name, email, password);
        const userName = newUser[0].name;
        const verificationToken = newUser.email_token;

        req.flash(
            "success_msg",
            `You are now registered as ${userName}!`
        );

        await sendVerificationEmail(email, verificationToken)

        res.redirect("/users/verify");

    } catch (/** @type {any} */   err) {
        res.status(500).send({ message: err.message });
    }
}

module.exports = { registerUser };