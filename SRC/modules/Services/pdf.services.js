import PDFDocument from 'pdfkit';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';
import fs from 'fs';

// Escape special characters and normalize fractions
const escapeText = (text) => {
    if (!text) return '';
    return String(text)
        .replace(/[&%#$_{}]/g, '\\$&')
        .replace(/[\n\r]/g, ' ')
        .replace(/½/g, '1/2')
        .replace(/¼/g, '1/4')
        .slice(0, 400);
};

// Calculate BMR using Katch-McArdle
const calculateBMR = (weight, fatPercentage) => {
    const leanMass = weight * (1 - fatPercentage / 100);
    return 370 + 21.6 * leanMass;
};

// Calculate TDEE based on activity level
const calculateTDEE = (bmr, activityLevel) => {
    const multipliers = {
        sedentary: 1.2,
        lightly_active: 1.375,
        moderately_active: 1.5,
        very_active: 1.725,
        extremely_active: 1.9,
    };
    return bmr * (multipliers[activityLevel] || multipliers.moderately_active);
};

// Estimate protein intake
const estimateProteinIntake = (dietPlan, weight, preferences) => {
    const proteinPerMeal = preferences.toLowerCase().includes('high protein')
        ? { breakfast: 55, lunch: 65, dinner: 70, snack1: 20, snack2: 15 }
        : { breakfast: 30, lunch: 40, dinner: 45, snack1: 10, snack2: 10 };
    const estimatedProtein = Object.values(proteinPerMeal).reduce((sum, val) => sum + val, 0);
    const targetProteinPerKg = preferences.toLowerCase().includes('high protein') ? 2.0 : 1.2;
    const calculatedProtein = targetProteinPerKg * weight;
    return Math.min(estimatedProtein, calculatedProtein);
};

// Predict effect
const predictEffect = (dietPlan, preferences, userData = {}) => {
    const { goal, totalCalories } = dietPlan;
    const {
        weight = 80,
        height = 175,
        age = 25,
        gender = 'male',
        fatPercentage = 15,
        activityLevel = 'moderately_active',
        trainingExperience = 'beginner',
    } = userData;

    const normalizedGoal = (goal || 'custom').trim().toLowerCase();
    const fatMass = weight * (fatPercentage / 100);
    const leanMass = weight - fatMass;
    const bmr = calculateBMR(weight, fatPercentage);
    const tdee = calculateTDEE(bmr, activityLevel);
    const proteinGrams = estimateProteinIntake(dietPlan, weight, preferences);
    const proteinKcal = proteinGrams * 4;

    const muscleGainRates = {
        beginner: { min: 0.5, max: 1.0 },
        intermediate: { min: 0.2, max: 0.5 },
        advanced: { min: 0.1, max: 0.2 },
    };

    if (normalizedGoal === 'muscle gain') {
        const dailySurplus = totalCalories - tdee;
        const totalSurplus = dailySurplus * 30;
        const rate = muscleGainRates[trainingExperience] || muscleGainRates.beginner;
        const muscleEfficiency = proteinGrams >= 1.6 * weight ? 0.7 : 0.5;
        const muscleGainKg = Math.min(
            (totalSurplus * muscleEfficiency) / 2500,
            rate.max * (30 / 30.42)
        ).toFixed(1);
        const muscleGainMin = Math.max(muscleGainKg * 0.9, rate.min * (30 / 30.42)).toFixed(1);
        const fatLossKg = Math.min((proteinGrams * 30 * 0.01) / 7700, 0.5).toFixed(1);
        const fatLossMax = (fatLossKg * 1.3).toFixed(1);
        const strengthGain = trainingExperience === 'beginner' ? '5–10%' : '2–5%';
        const waistReduction = fatLossKg > 0 ? '1–2cm' : '0–1cm';

        return `With your high-protein diet (~${Math.round(proteinGrams)}g/day) and muscle gain goal, you can expect to gain ${muscleGainMin}–${muscleGainKg}kg of muscle, lose ${fatLossKg}–${fatLossMax}kg of fat, increase strength by ${strengthGain}, and reduce waist circumference by ${waistReduction} over 30 days, assuming consistent resistance training 3–4 times per week and 85–90% diet adherence.`;
    } else if (normalizedGoal === 'weight loss') {
        const dailyDeficit = tdee - totalCalories;
        const totalDeficit = dailyDeficit * 30;
        const fatLossKg = Math.min(totalDeficit / 7700, 3).toFixed(1);
        const fatLossMax = (fatLossKg * 1.2).toFixed(1);
        const muscleLoss = proteinGrams >= 1.6 * weight ? 'minimal' : '0.1–0.2kg';
        const strengthGain = proteinGrams >= 1.6 * weight ? '2–5%' : 'maintained';
        const waistReduction = fatLossKg > 1 ? '2–4cm' : '1–2cm';

        return `With your diet (~${Math.round(proteinGrams)}g/day) and weight loss goal, you can expect to lose ${fatLossKg}–${fatLossMax}kg of fat, preserve muscle with ${muscleLoss} loss, maintain or increase strength by ${strengthGain}, and reduce waist circumference by ${waistReduction} over 30 days with regular exercise and 85–90% diet adherence.`;
    } else if (normalizedGoal === 'maintenance') {
        const bodyCompChange = proteinGrams >= 1.4 * weight ? 'maintain or slightly improve' : 'maintain';
        const strengthGain = trainingExperience === 'beginner' ? '3–7%' : '1–3%';
        const waistChange = proteinGrams >= 1.4 * weight ? '0–1cm reduction' : 'stable';

        return `With your diet (~${Math.round(proteinGrams)}g/day) and maintenance goal, you can expect to ${bodyCompChange} body composition, increase strength by ${strengthGain}, and maintain or slightly reduce waist circumference (${waistChange}) over 30 days with consistent exercise and 85–90% diet adherence.`;
    }

    return `With your diet (~${Math.round(proteinGrams)}g/day), you can expect improved health, energy, and body composition over 30 days with consistent exercise and 85–90% diet adherence.`;
};

export async function generateDietPlanPdf(dietPlan, maxDays = 10, preferences = '', userData = {}) {
    try {
        // Validate dietPlan
        if (!dietPlan?.dietPlan?.length || !dietPlan.totalCalories) {
            throw new Error('Invalid diet plan: missing dietPlan array or totalCalories');
        }

        console.log('Generating PDF with dietPlan:', {
            totalCalories: dietPlan.totalCalories,
            goal: dietPlan.goal,
            calorieSplit: dietPlan.calorieSplit,
            userData,
        });

        // Load banner image
        let imageBuffer = null;
        try {
            imageBuffer = fs.readFileSync('C:/Users/TW/One Drive/Desktop/graduation project/public/banner.png');
            console.log('Banner image loaded successfully');
        } catch (err) {
            console.warn('Failed to load banner image:', err.message);
            imageBuffer = null;
        }

        // Create a new PDF document
        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 40, bottom: 40, left: 40, right: 40 },
            bufferPages: true,
            font: 'Helvetica',
        });
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {});

        // Styling constants
        const colors = {
            header: '#ff7f50', // Orange for headers and title background
            text: '#333', // Dark gray for body text
            footer: '#666', // Footer text
        };
        const fonts = {
            regular: 'Helvetica',
            bold: 'Helvetica-Bold',
        };

        // Helper: Check if content fits on current page
        const checkPageBreak = (requiredHeight, currentY) => {
            if (currentY + requiredHeight + 20 > doc.page.height - doc.page.margins.bottom) {
                doc.addPage();
                return doc.page.margins.top;
            }
            return currentY;
        };

        // Helper: Add wrapped text with accurate height tracking
        const addWrappedText = (text, x, y, options = {}) => {
            const { font = fonts.regular, size = 10, color = colors.text, align = 'left', maxWidth = doc.page.width - 95 } = options;
            let currentY = y;

            // Set font and size
            doc.font(font).fontSize(size);

            // Estimate text height
            const textHeight = doc.heightOfString(text, { width: maxWidth, lineGap: 3 });
            currentY = checkPageBreak(textHeight + size + 20, currentY);

            // Render text
            doc.fillColor(color).text(text, x, currentY, { align, width: maxWidth, lineBreak: true, lineGap: 3 });
            currentY += textHeight + size * 0.5;

            return currentY;
        };

        // First Page: Banner and Intro
        if (imageBuffer) {
            doc.image(imageBuffer, doc.page.margins.left, 0, {
                width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
                height: 80,
            });
        } else {
            doc
                .fillColor('white')
                .rect(0, 0, doc.page.width, 80)
                .fill(colors.header);
        }
        doc
            .font(fonts.bold)
            .fontSize(20)
            .fillColor('white')
            .text('Your Personalized Diet Plan', 0, imageBuffer ? 30 : 30, { align: 'center' });

        let yPos = imageBuffer ? 80 : 80;
        yPos += 20;
        const tags = dietPlan.dietPlan[0]?.meals?.breakfast?.dietaryTags?.join(', ') || preferences || 'Custom';
        yPos = addWrappedText(
            `This diet plan is tailored to your goals: ${escapeText(tags)}. Total daily calories: ${dietPlan.totalCalories} kcal. Enjoy your journey to better health!`,
            doc.page.margins.left,
            yPos,
            { font: fonts.regular, size: 12, color: colors.text, align: 'center' }
        );

        // Calorie Split Summary
        yPos += 10;
        yPos = addWrappedText(
            'Daily Calorie Breakdown',
            doc.page.margins.left,
            yPos,
            { font: fonts.bold, size: 12, color: colors.header, align: 'center' }
        );
        yPos += 5;
        const calorieSplit = dietPlan.calorieSplit || {};
        ['Breakfast', 'Lunch', 'Dinner', 'Snack 1', 'Snack 2'].forEach(meal => {
            const kcal = calorieSplit[meal.toLowerCase().replace(' ', '')] || 'Unknown';
            yPos = addWrappedText(
                `${meal}: ${kcal} kcal`,
                doc.page.margins.left,
                yPos,
                { font: fonts.regular, size: 10, color: colors.text, align: 'center' }
            );
            yPos += 5;
        });

        // Predicted Effect
        yPos += 10;
        yPos = addWrappedText(
            'Predicted Effect',
            doc.page.margins.left,
            yPos,
            { font: fonts.bold, size: 12, color: colors.header, align: 'center' }
        );
        yPos += 5;
        const effectText = predictEffect(dietPlan, preferences, userData);
        yPos = addWrappedText(
            effectText,
            doc.page.margins.left,
            yPos,
            { font: fonts.regular, size: 10, color: colors.text, align: 'center' }
        );

        // Process each day
        dietPlan.dietPlan.slice(0, maxDays).forEach(day => {
            if (!day?.meals) return;
            doc.addPage();
            let currentY = doc.page.margins.top;

            // Day Header
            currentY = addWrappedText(
                `Day ${day.day}`,
                doc.page.margins.left,
                currentY,
                { font: fonts.bold, size: 16, color: colors.header, align: 'center' }
            );
            currentY += 10;

            // Render Reciplore branding
            doc
                .font(fonts.bold)
                .fontSize(8)
                .fillColor(colors.header)
                .text('Reciplore', doc.page.margins.left, 20);
            doc
                .font(fonts.regular)
                .fontSize(8)
                .fillColor(colors.text)
                .text(`Goal: ${dietPlan.goal || 'Custom'}`, doc.page.width - 150, 20, { align: 'right', width: 120 });

            Object.entries(day.meals).forEach(([mealType, recipe]) => {
                if (!recipe) return;

                // Meal Type
                currentY = addWrappedText(
                    mealType.charAt(0).toUpperCase() + mealType.slice(1),
                    doc.page.margins.left,
                    currentY,
                    { font: fonts.bold, size: 14, color: colors.text }
                );
                currentY += 10;

                // Recipe Title
                currentY = addWrappedText(
                    escapeText(recipe.title || 'Untitled Recipe'),
                    doc.page.margins.left,
                    currentY,
                    { font: fonts.bold, size: 12, color: colors.header }
                );
                currentY += 5;

                // Description
                currentY = addWrappedText(
                    `Description: ${escapeText(recipe.description || 'No description available')}`,
                    doc.page.margins.left,
                    currentY,
                    { font: fonts.regular, size: 10, color: colors.text }
                );
                currentY += 10;

                // Ingredients
                currentY = addWrappedText(
                    'Ingredients:',
                    doc.page.margins.left,
                    currentY,
                    { font: fonts.bold, size: 10, color: colors.text }
                );
                currentY += 5;
                (recipe.ingredients || []).forEach(ingredient => {
                    const quantity = ingredient.quantity ? `${escapeText(ingredient.quantity)} ` : '';
                    const name = escapeText(ingredient.name || '');
                    const notes = ingredient.notes ? ` (${escapeText(ingredient.notes)})` : '';
                    const substitute = ingredient.substitute ? ` [Substitute: ${escapeText(ingredient.substitute)}]` : '';
                    currentY = addWrappedText(
                        `• ${quantity}${name}${notes}${substitute}`,
                        doc.page.margins.left + 10,
                        currentY,
                        { font: fonts.regular, size: 10, color: colors.text }
                    );
                    currentY += 5;
                });
                currentY += 5;

                // Instructions
                currentY = addWrappedText(
                    'Instructions:',
                    doc.page.margins.left,
                    currentY,
                    { font: fonts.bold, size: 10, color: colors.text }
                );
                currentY += 5;
                (recipe.instructions || []).forEach(instruction => {
                    currentY = addWrappedText(
                        `${instruction.step}. ${escapeText(instruction.description || 'No description')}`,
                        doc.page.margins.left + 10,
                        currentY,
                        { font: fonts.regular, size: 10, color: colors.text }
                    );
                    currentY += 5;
                });
                currentY += 5;

                // Nutritional Information
                currentY = addWrappedText(
                    'Nutritional Information (per serving):',
                    doc.page.margins.left,
                    currentY,
                    { font: fonts.bold, size: 10, color: colors.text }
                );
                currentY += 5;
                const nutrition = recipe.nutrition || {};
                ['Calories', 'Protein', 'Fat', 'Carbohydrates'].forEach(nutrient => {
                    currentY = addWrappedText(
                        `• ${nutrient}: ${escapeText(nutrition[nutrient.toLowerCase()] || 'Unknown')}`,
                        doc.page.margins.left + 10,
                        currentY,
                        { font: fonts.regular, size: 10, color: colors.text }
                    );
                    currentY += 5;
                });
                currentY += 5;

                // Dietary Tags
                currentY = addWrappedText(
                    'Dietary Tags:',
                    doc.page.margins.left,
                    currentY,
                    { font: fonts.bold, size: 10, color: colors.text }
                );
                currentY += 5;
                const tags = recipe.dietaryTags?.length ? recipe.dietaryTags : [preferences || 'None'];
                tags.forEach(tag => {
                    currentY = addWrappedText(
                        `• ${escapeText(tag)}`,
                        doc.page.margins.left + 10,
                        currentY,
                        { font: fonts.regular, size: 10, color: colors.text }
                    );
                    currentY += 5;
                });

                currentY += 10;
            });
        });

        // Footer on All Pages
        doc.on('pageAdded', () => {
            doc
                .font(fonts.regular)
                .fontSize(8)
                .fillColor(colors.footer)
                .text(
                    '© 2025 Reciplore. Contact: support@reciplore.app',
                    doc.page.margins.left,
                    doc.page.height - doc.page.margins.bottom - 20,
                    { align: 'center', width: doc.page.width - doc.page.margins.left - doc.page.margins.right }
                );
            doc
                .font(fonts.regular)
                .fontSize(8)
                .fillColor(colors.footer)
                .text(
                    `Page ${doc.bufferedPageRange().start + 1}`,
                    doc.page.width - doc.page.margins.right - 50,
                    doc.page.height - doc.page.margins.bottom - 20,
                    { align: 'right' }
                );
        });

        // Finalize PDF
        doc.end();

        // Compress PDF
        const rawBuffer = await new Promise((resolve, reject) => {
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);
        });

        const pdfLibDoc = await PDFLibDocument.load(rawBuffer);
        const compressedBuffer = await pdfLibDoc.save({
            useObjectStreams: true,
            addDefaultPage: false,
            compress: true,
            updateFieldAppearances: false,
            objectsPerTick: 50,
        });

        console.log('PDF size (MB):', compressedBuffer.length / (1024 * 1024));
        return compressedBuffer;
    } catch (error) {
        console.error('Error generating PDF with pdfkit:', error.message);
        throw new Error('Failed to generate diet plan PDF');
    }
}