const { ProjectModel } = require("../models/project.Model");
const { successResponse, errorResponse } = require('../utils/helpers');

exports.getAllProjects = async (req, res) => {
  try {
    const { query } = req.query;
    let filter = {};
    
    // If query parameter exists and is not empty, add name filter
    if (query && query.trim() !== '') {
      filter.name = { $regex: query, $options: 'i' }; // Case-insensitive search
    }

    const projects = await ProjectModel.find(filter).populate('properties');
    return res.status(200).json(successResponse(projects));
  } catch (error) {
    console.error('Get projects error:', error);
    return res.status(500).json(errorResponse('Server error while fetching projects.'));
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await ProjectModel.findById(req.params.id).populate('properties');
    
    if (!project) {
      return res.status(404).json(errorResponse('Project not found.', 404));
    }
    return res.status(200).json(successResponse(project));
  } catch (error) {
    console.error('Get project error:', error);
    return res.status(500).json(errorResponse('Server error while fetching project.'));
  }
};

exports.getPropertyById = async (req, res) => {
  try {
    const propertyId = req.params.id;
    
    // Find all projects and search for the property
    const projects = await ProjectModel.find({}).populate('properties');
    let foundProperty = null;
    
    // Search through all projects to find the property
    for (const project of projects) {
      const property = project.properties.find(p => p._id.toString() === propertyId);
      if (property) {
        foundProperty = property;
        break;
      }
    }
    
    if (!foundProperty) {
      return res.status(404).json(errorResponse('Property not found.', 404));
    }
    
    return res.status(200).json(successResponse(foundProperty));
  } catch (error) {
    console.error('Get property error:', error);
    return res.status(500).json(errorResponse('Server error while fetching property.'));
  }
};

exports.createProject = async (req, res) => {
  try {
    const { name, description, developer, properties, image } = req.body;
    
  

    // Validate properties if provided
    if (properties && Array.isArray(properties)) {
      for (const property of properties) {
        if (!property.bedrooms || !property.bathrooms) {
          return res.status(400).json(errorResponse('Bedrooms and bathrooms are required for each property.'));
        }
        if (property.bedrooms < 1 || property.bathrooms < 1) {
          return res.status(400).json(errorResponse('Bedrooms and bathrooms must be at least 1.'));
        }
      }
    }

    const project = new ProjectModel({
      name,
      description,
      image,
      developer,
      properties: properties || []
    });

    await project.save();
    
    return res.status(201).json(successResponse({
      message: 'Project created successfully.',
      project
    }));
  } catch (error) {
    console.error('Create project error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json(errorResponse(error.message));
    }
    return res.status(500).json(errorResponse('Server error while creating project.'));
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { name, description, developer, properties, image } = req.body;
    const projectId = req.params.id;

    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return res.status(404).json(errorResponse('Project not found.', 404));
    }

    // Validate properties if provided
    if (properties && Array.isArray(properties)) {
      for (const property of properties) {
        if (!property.bedrooms || !property.bathrooms) {
          return res.status(400).json(errorResponse('Bedrooms and bathrooms are required for each property.'));
        }
        if (property.bedrooms < 1 || property.bathrooms < 1) {
          return res.status(400).json(errorResponse('Bedrooms and bathrooms must be at least 1.'));
        }
      }
    }

    // Update project fields
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
   
    if (developer !== undefined) project.developer = developer;
    if (properties !== undefined) project.properties = properties;
    if (image !== undefined) project.image = image;
    await project.save();
    
    return res.status(200).json(successResponse({
      message: 'Project updated successfully.',
      project
    }));
  } catch (error) {
    console.error('Update project error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json(errorResponse(error.message));
    }
    return res.status(500).json(errorResponse('Server error while updating project.'));
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await ProjectModel.findByIdAndDelete(projectId);
    
    if (!project) {
      return res.status(404).json(errorResponse('Project not found.', 404));
    }

    return res.status(200).json(successResponse({
      message: 'Project deleted successfully.'
    }));
  } catch (error) {
    console.error('Delete project error:', error);
    return res.status(500).json(errorResponse('Server error while deleting project.'));
  }
};

exports.searchForProperties = async (req, res) => {
  try {
    const { type, areaRange, priceRange, key } = req.body;

    // Find all projects and get their properties
    const projects = await ProjectModel.find({}).populate('properties');
    let matchingProperties = projects.reduce((acc, project) => {
      return [...acc, ...project.properties];
    }, []);

    // Apply filters only if they are provided
    if (type) {
      const validTypes = ['chalet', 'apartment', 'twin_villa', 'standalone_villa'];
      if (!validTypes.includes(type)) {
        return res.status(400).json(errorResponse('Invalid property type.'));
      }
      matchingProperties = matchingProperties.filter(property => 
        property.type === type
      );
    }

    if (areaRange) {
      const validAreaRanges = ['less_than_100', '100_to_150', '150_to_200', 'over_200'];
      if (!validAreaRanges.includes(areaRange)) {
        return res.status(400).json(errorResponse('Invalid area range.'));
      }
      matchingProperties = matchingProperties.filter(property => 
        property.areaRange === areaRange
      );
    }

    if (priceRange) {
      const validPriceRanges = ['2_to_3_million', '3_to_4_million', '4_to_5_million', 'over_5_million'];
      if (!validPriceRanges.includes(priceRange)) {
        return res.status(400).json(errorResponse('Invalid price range.'));
      }
      matchingProperties = matchingProperties.filter(property => 
        property.priceRange === priceRange
      );
    }

    // Apply key search if provided
    if (key) {
      const searchKey = key.toLowerCase();
      matchingProperties = matchingProperties.filter(property => 
        property.title.toLowerCase().includes(searchKey)
      );
    }

    return res.status(200).json(successResponse({
      count: matchingProperties.length,
      properties: matchingProperties
    }));
  } catch (error) {
    console.error('Search properties error:', error);
    return res.status(500).json(errorResponse('Server error while searching properties.'));
  }
};
