// export class ApiFeatures {
//     //mongooseQuery: Recipe(model)
//     //query:req.query
//     constructor(mongooseQuery, query) {
//         this.mongooseQuery = mongooseQuery;
//         this.query = query;
//     }
//     sort(){

//         const options ={
//             sort:{views:-1}
//         }
//         this.mongooseQuery=this.mongooseQuery.paginate({},options);
//         return this
//     }
//     pagination(){
//         const {page=1,limit=10}=this.query;
//         const skip=(page-1)*limit
//         const options ={
//             page,
//             limit
//             ,skip
//         }
        
//         this.mongooseQuery=this.mongooseQuery.paginate({},options);
//         return this
//     }
//     filter(){

//     }
//     excute(){
//         return this.mongooseQuery.exec()
//     }
// }

export class ApiFeatures {
    constructor(mongooseQuery, queryString) {
        this.mongooseQuery = mongooseQuery;
        this.queryString = queryString;
        this.queryFilters = {};
        this.options = {
            page: parseInt(queryString.page) || 1,
            limit: parseInt(queryString.limit) || 10,
            select: "-createdAt -updatedAt", // Default fields
            sort: "-views", // Default sorting
            populate: [], // Store populate fields
        };
    }

    filter() {
        let queryObj = { ...this.queryString };
        const excludedFields = ["sort", "page", "limit", "fields", "search", "populate"];
        excludedFields.forEach((el) => delete queryObj[el]);

        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/gt|gte|lt|lte|regex|ne|eq/g, (match) => `$${match}`);
        this.queryFilters = JSON.parse(queryStr);

        return this;
    }

    search() {
        if (this.queryString.search) {
            this.queryFilters.name = { $regex: this.queryString.search, $options: "i" };
        }
        return this;
    }

    sort() {
        if (this.queryString.sort) {
            this.options.sort = this.queryString.sort.split(",").join(" ");
        }
        return this;
    }

    limitFields(fields) {
        if (fields) {
            this.options.select = fields;
        }
        return this;
    }

    populate(fields) {
        if (fields) {
            this.options.populate = fields;
        }
        return this;
    }

    paginate() {
        return this;
    }

    async execute() {
        return await this.mongooseQuery.paginate(this.queryFilters, this.options);
    }
}
