const reqKeys=['body','headers','query','params']
export const validationMiddleware=(schema)=>{
    return async (req,res,next)=>{
        let validationErrors =[];
        for(const key of reqKeys){
            const validationResult=schema[key]?.validate(req[key],{abortEarly:false})

            if(validationResult?.error){
                validationErrors.push(validationResult.error.details);
            }
        }
        if(validationErrors.length>0){
            return res.status(400).json({message:"validation error",errors:validationErrors})
        }
        next();
        
    }
}
