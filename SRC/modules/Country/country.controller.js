import Country from "../../../DB/models/country.model.js";

export const addCountry=async(req, res, next) => {
    const { name} = req.body;
    
    if (!name) {
        return res.status(400).json({ success: false, message: "Please provide the country name" });
    }
    const newCountry = Country.create({ name });
    
    res.status(201).json({ success: true, message: "Country added successfully", country: newCountry });
}
