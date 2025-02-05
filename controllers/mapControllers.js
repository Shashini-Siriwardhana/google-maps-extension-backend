const Joi = require('joi');
const db = require('../config/db');

// Get all routes
exports.getRoutes = (req, res) => {
    const { id } = req.query; 
    let sql = '';
    sql = `
            SELECT routeDetails.id AS routeId, routeDetails.starting_point, routeDetails.location AS startingPointLocation, routeDestinations.id AS destinationId, routeDestinations.destination, routeDestinations.location AS destinationLocation, routeDestinations.transportation_mode 
            FROM routeDetails INNER JOIN routeDestinations 
            ON routeDetails.id = routeDestinations.route_Id
            ${id ? `WHERE routeDetails.id = ${parseInt(id)}` : ''}`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'Item not found' });
        
        // Group results using the helper function
        const groupedData = groupRoutesAndDestinations(results);
    
        // Send the grouped data as a response
        res.send({
            status: 200,
            routes: Object.values(groupedData)
        });
    });
    
}

// Helper function to group routes and destinations
const groupRoutesAndDestinations = (results) => {
    return results.reduce((acc, row) => {
        if (!acc[row.routeId]) {
            acc[row.routeId] = {
                id: row.routeId,
                starting_point: row.starting_point,
                location: row.startingPointLocation,
                destinations: []
            };
        }
        acc[row.routeId].destinations.push({
            id: row.destinationId,
            destination: row.destination,
            location: row.destinationLocation,
            transportation_mode: row.transportation_mode
        });
        return acc;
    }, {});
}

// Add new route
exports.addRoute = async(req, res) => {
    const {error} = validateAddRoute(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const query1 = 'INSERT INTO routeDetails (starting_point, location) VALUES (?, ?)';
    const query2 = 'INSERT INTO routeDestinations (id, route_Id, destination, transportation_mode, location) VALUES (?, ?, ?, ?, ?)';
    try{
        await db.promise().beginTransaction();
        const [result] = await db.promise().query(query1, [null, null]);
        await db.promise().query(query2, [1, result.insertId, null, req.body.destinations[0].transportationMode, null]);
        await db.promise().commit();
        res.status(201).json(
            { 
                status: 201,
                message: "Successfully Created.",
                routes: {
                        id: result.insertId,
                        starting_point: null,
                        location: null,
                        destinations: [{
                            id: 1,
                            transportation_mode: req.body.destinations[0].transportationMode
                        }],
                    }
            });
    } catch (err) {
        console.log("error", err)
        // Rollback the transaction if any query fails
        await db.promise().rollback();
    } finally {
        
    }
}

// Delete route
exports.deleteRoute = async(req, res) => {
    const {error} = validateRouteId(req.query);
    if (error) return res.status(400).send(error.details[0].message);

    const route = {
        id: parseInt(req.query.id)
    }

    const sql = `DELETE FROM routeDetails WHERE id=${route.id}`;
    db.query(sql, [route.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.send({
            status: 200,
            data: {
                id: route.id,
            },
            message: 'Successfully deleted.'
        });
    });
}

// Add destination
exports.addDestination = async(req, res) => {
    const {error} = validateAddDestination(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    const route = {
        id: req.body.id,
        destination: req.body.destination,
    };
    const query = 'INSERT INTO routeDestinations (id, route_Id, destination, transportation_mode, location) VALUES (?, ?, ?, ?, ?)';
    // Get the max id for the given routeId
    const [rows] = await db.promise().query(
        `SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM routeDestinations WHERE route_Id = ${route.id}`,
    );
    const nextId = rows[0].nextId;
    db.query(query, [nextId, route.id, null, route.destination.transportationMode, null], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'Item not found' });
        res.send(
            { 
                status: 200,
                message: "Successfully added new destination.",
                data: {
                        id: route.id,
                        destination: {
                            id: nextId,
                            destination: null,
                            transportation_mode: route.destination.transportationMode,
                            location: null
                        },
                    }
            });
    });
}

// Update starting point
exports.updateStartingPoint = async(req, res) => {
    const {error} = validateAddStartingPoint(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    const route = {
        id: req.body.id,
        starting_point: `'${req.body.startingPoint}'`,
        location: JSON.stringify(req.body.location),
    };
    const query = `UPDATE routeDetails 
               SET starting_point=?, location=? 
               WHERE id=?`;
    db.query(query, [route.starting_point, route.location, parseInt(route.id)], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'Item not found' });
        res.send(
            { 
                status: 200,
                message: "Successfully Updated.",
                data: {
                        id: route.id,
                        startingPoint: route.starting_point,
                        location: JSON.parse(route.location)
                    }
            });
    })
}

// Update destination
exports.updateDestination = async(req, res) => {
    const {error} = validateDestination(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    const route = {
        id: req.body.id,
        destination: {
            id: req.body.destination.id,
            destination: req.body.destination.destination,
            location: req.body.destination.location,
        }
    };
    const query = `UPDATE routeDestinations 
               SET destination=?, location=? 
               WHERE id=? AND route_Id=?`;
    db.query(query, [route.destination.destination, JSON.stringify(route.destination.location), parseInt(route.destination.id), parseInt(route.id)], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'Item not found' });
        res.send(
            { 
                status: 200,
                message: "Successfully Updated.",
                data: route
            });
    })
}

exports.updateTransportationMode = async(req, res) => {
    const {error} = validateUpdateTransportationMode(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const route = {
        id: req.body.id,
        destination: {
            id: req.body.destination.id,
            transportation_mode: req.body.destination.transportationMode
        }
    };
    const query = `UPDATE routeDestinations 
               SET transportation_mode=? 
               WHERE id=? AND route_id=?`;
    db.query(query, [route.destination.transportation_mode, parseInt(route.destination.id), parseInt(route.id)], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.affectedRows === 0) return res.status(404).json({ message: 'Item not found' });

        res.send(
            { 
                status: 200,
                message: "Successfully Updated.",
                data: route
            });
    })

}



// Update route
exports.updateRoute = async(req, res) => {
    console.log(req.body)
    const {error} = validateRoute(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const route = {
        id: req.body.id,
        starting_point: req.body.startingPoint ? `'${req.body.startingPoint}'` : null,
        location: req.body.location ? JSON.stringify(req.body.location) : null,
        destinations: req.body.destinations,
    };
    const query1 = `UPDATE routeDetails 
                SET starting_point='${route.starting_point}', location=${route.location} 
                WHERE id=${parseInt(route.id)}`;
    try {
        await db.promise().beginTransaction();

        await db.promise().query(query1, [route.starting_point, route.location, route.id]);

        if (route.destinations.length > 0) {

            // Iterate over each destination
            for (let destination of route.destinations) {
                const query2 = `
                UPDATE routeDestinations
                SET
                    route_Id = ${route.id},
                    destination = '${destination.destination ? destination.destination : null}',
                    location = ${destination.location ? JSON.stringify(destination.location) : null},
                    transportation_mode = '${destination.transportationMode}'
                WHERE id = ${destination.id} AND route_Id = ${route.id}; `;

                // Execute the query for each destination
                await db.promise().query(query2, [
                    route.id,
                    destination.destination ? destination.destination : null,
                    destination.location ? JSON.stringify(destination.location) : null,
                    destination.transportation_mode
                ]);
            }
        }

        // Commit the transaction if both queries succeed
        await db.promise().commit();
        req.query.id = route.id;
        exports.getRoutes(req, res);

    } catch (err) {
        console.log("error", err)
        // Rollback the transaction if any query fails
        await db.promise().rollback();
        return res.status(404).json({ message: "Update unsuccessful" });
    } finally {
    }

}

const locationSchema = Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required()
});

const validateRoute = (route) => {

    const destinationSchema = Joi.object({
        id: Joi.number().integer().required(),
        destination: Joi.string(),
        location: locationSchema,
        transportationMode: Joi.string().valid('driving', 'walking').required()
    });

    const schema = Joi.object({
        id: Joi.number().required(),
        startingPoint: Joi.string(),
        location: locationSchema,
        destinations: Joi.array().min(1).items(destinationSchema).required(),
    });

    return schema.validate(route);
}


const validateAddRoute = (route) => {
    const destinationSchema = Joi.object({
        transportationMode: Joi.string().valid('driving', 'walking').required()
      });

    const schema = Joi.object({
        destinations: Joi.array().min(1).items(destinationSchema).required(),
    });

    return schema.validate(route);
}

const validateAddStartingPoint = (route) => {
    const schema = Joi.object({
        id: Joi.number().required(),
        startingPoint: Joi.string().required(),
        location: locationSchema.required(),
    });
    return schema.validate(route);
}

const validateAddDestination = (route) => {
    const destinationSchema = Joi.object({
        transportationMode: Joi.string().valid('driving', 'walking').required()
      });

    const schema = Joi.object({
        id: Joi.number().required(),
        destination: destinationSchema.required(),
    });

    return schema.validate(route);
}

const validateRouteId = (route) => {
    const schema = Joi.object({
        id: Joi.required()
    })

    return schema.validate(route);
}

const validateUpdateTransportationMode = (route) => {
    const destinationSchema = Joi.object({
        id: Joi.number().integer().required(),
        transportationMode: Joi.string().valid('driving', 'walking').required()
      });
      
    const schema = Joi.object({
        id: Joi.number().integer().required(),
        destination: destinationSchema.required()
    })
    return schema.validate(route);
}

const validateDestination = (route) => {
    const destinationSchema = Joi.object({
        id: Joi.number().integer().required(),
        destination: Joi.string().required(),
        location: locationSchema.required(),
    });

    const schema = Joi.object({
        id: Joi.number().integer().required(),
        destination: destinationSchema.required()
    })
    return schema.validate(route);
}

