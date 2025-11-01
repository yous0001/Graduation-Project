import axios from "axios";
import Country from "../../../DB/models/country.model.js";

export const addCountry = async (req, res, next) => {
    const { name } = req.body;
    const user = req.user;
    
    if (!name) {
        return next(new Error("Please provide the country name", { cause: 400 }));
    }
    
    const newCountry = await Country.create({ 
        name,
        createdBy: user._id 
    });
    
    res.status(201).json({ success: true, message: "Country added successfully", country: newCountry });
}

export const getAllCountries = async (req, res, next) => {
    const countries = await Country.find();
    res.status(200).json({ success: true, message: "All countries", countries });
}

export const addMealDBCountries = async (req, res, next) => {
    const user = req.user;
    const response = await axios.get("https://www.themealdb.com/api/json/v1/1/list.php?a=list");
    const insertedCountries = [];
    
    for (const country of response.data.meals) {
        const { strArea } = country;
        const isCountryExists = await Country.findOne({ name: strArea });
        if (isCountryExists) continue;

        const countryObj = {
            name: strArea,
            createdBy: user._id
        };
        const newCountry = await Country.create(countryObj);
        insertedCountries.push(newCountry);
    }
    
    if (insertedCountries.length == 0) {
        return res.status(200).json({ success: true, message: "No new countries to be added" });
    }
    
    res.status(201).json({ 
        success: true, 
        message: "Countries added successfully", 
        countries: insertedCountries 
    });
}

export const updateCountry = async (req, res, next) => {
    const { name, description } = req.body;
    const { id } = req.params;
    const user = req.user;

    if (!id) return next(new Error("Please provide the country id", { cause: 400 }));
    if (!name && !description) return next(new Error("Please provide the country name or description", { cause: 400 }));

    const country = await Country.findById(id);
    if (!country) return next(new Error("Country not found", { cause: 404 }));
    
    if (name) country.name = name;
    if (description) country.description = description;
    country.updatedBy = user._id;
    
    await country.save();
    res.status(200).json({ success: true, message: "Country updated successfully", country });
}

export const deleteCountry = async (req, res, next) => {
    const { id } = req.params;

    if (!id) return next(new Error("Please provide the country id", { cause: 400 }));
    
    const country = await Country.findByIdAndDelete(id);
    if (!country) return next(new Error("Country not found", { cause: 404 }));

    res.status(200).json({ success: true, message: "Country deleted successfully" });
}
