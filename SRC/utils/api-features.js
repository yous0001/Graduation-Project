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

import apiConfig from '../modules/Services/options/api.config.js';

export class ApiFeatures {
    constructor(mongooseQuery, queryString = {}) {
        this.mongooseQuery = mongooseQuery;
        this.queryString = queryString;
        this.queryFilters = {};
        this.options = {
            page: Math.max(1, parseInt(queryString.page, 10) || 1),
            limit: parseInt(queryString.limit, 10) || apiConfig.response.defaultPageSize || 12,
            select: "-createdAt -updatedAt", // Default fields
            sort: "-views", // Default sorting
            populate: [], // Store populate fields
            lean: true,
        };
        
        // Enforce maximum page size limit
        const maxLimit = apiConfig.response.maxPageSize || 100;
        if (this.options.limit > maxLimit) {
            this.options.limit = maxLimit;
        }
    }

    filter() {
        const queryObj = { ...this.queryString };
        const excludedFields = ["sort", "page", "limit", "fields", "search", "populate"];
        excludedFields.forEach((el) => delete queryObj[el]);

        for (const key in queryObj) {
            if (queryObj[key] === null || queryObj[key] === undefined || queryObj[key] === "" || queryObj[key] === 'null' || queryObj[key] === 'undefined') {
                delete queryObj[key];
            }
        }

        let queryStr = JSON.stringify(queryObj);
        // Only replace isolated operators with word boundary to avoid corrupting ObjectIds or words containing 'ne', 'eq', etc.
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|regex|ne|eq|in|nin)\b/g, (match) => `$${match}`);
        this.queryFilters = JSON.parse(queryStr);

        return this;
    }

    condition(conditions) {
        this.queryFilters = { ...this.queryFilters, ...conditions };
        return this;
    }

    search() {
        if (this.queryString.search && typeof this.queryString.search === 'string') {
            const sanitized = this.queryString.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            if (sanitized) {
                this.queryFilters.name = { $regex: sanitized, $options: "i" };
            }
        }
        return this;
    }

    sort() {
        // Whitelist of sortable fields to prevent injection and guarantee index usage
        const SORTABLE = new Set([
            'createdAt', '-createdAt',
            'views', '-views',
            'Average_rating', '-Average_rating',
            'name', '-name',
            'appliedPrice', '-appliedPrice',
            'basePrice', '-basePrice',
            'stock', '-stock',
            'discount', '-discount',
            'updatedAt', '-updatedAt',
        ]);

        if (this.queryString.sort) {
            const parts = this.queryString.sort.split(',').filter((p) => SORTABLE.has(p.trim()));
            this.options.sort = parts.length > 0 ? parts.join(' ') : '-createdAt _id';
        } else {
            this.options.sort = '-views _id';
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
