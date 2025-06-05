const { ProjectModel } = require("../models/project.Model");
const { successResponse, errorResponse } = require('../utils/helpers');

exports.getAllProjects = async (req, res) => {
  try {
    const projects = await ProjectModel.find({}).populate('properties');
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

exports.createProject = async (req, res) => {
  try {
    const { name, description, location, developer, properties, image } = req.body;
    
    // Basic validation
    if (!name || !location || !location.coordinates) {
      return res.status(400).json(errorResponse('Name and location with coordinates are required.'));
    }

    const project = new ProjectModel({
      name,
      description,
      image,
      location: {
        type: 'Point',
        coordinates: location.coordinates
      },
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
    const { name, description, location, developer, properties } = req.body;
    const projectId = req.params.id;

    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return res.status(404).json(errorResponse('Project not found.', 404));
    }

    // Update project fields
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (location && location.coordinates) {
      project.location = {
        type: 'Point',
        coordinates: location.coordinates
      };
    }
    if (developer !== undefined) project.developer = developer;
    if (properties !== undefined) project.properties = properties;

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
    const { type, areaRange, priceRange, all } = req.body;

    // If 'all' is true, return all properties without filtering
    if (all === true) {
      const projects = await ProjectModel.find({}).populate('properties');
      const allProperties = projects.reduce((acc, project) => {
        return [...acc, ...project.properties];
      }, []);

      return res.status(200).json(successResponse({
        count: allProperties.length,
        properties: allProperties
      }));
    }

    // Validate that all required parameters are provided
    if (!type || !areaRange || !priceRange) {
      return res.status(400).json(errorResponse('Type, areaRange, and priceRange are required when not requesting all properties.'));
    }

    // Validate enum values
    const validTypes = ['chalet', 'apartment', 'twin_villa', 'standalone_villa'];
    const validAreaRanges = ['less_than_100', '100_to_150', '150_to_200', 'over_200'];
    const validPriceRanges = ['2_to_3_million', '3_to_4_million', '4_to_5_million', 'over_5_million'];

    if (!validTypes.includes(type)) {
      return res.status(400).json(errorResponse('Invalid property type.'));
    }
    if (!validAreaRanges.includes(areaRange)) {
      return res.status(400).json(errorResponse('Invalid area range.'));
    }
    if (!validPriceRanges.includes(priceRange)) {
      return res.status(400).json(errorResponse('Invalid price range.'));
    }

    // Find all projects and filter properties
    const projects = await ProjectModel.find({}).populate('properties');
    
    // Collect all matching properties
    const matchingProperties = projects.reduce((acc, project) => {
      const matchingProps = project.properties.filter(property => 
        property.type === type &&
        property.areaRange === areaRange &&
        property.priceRange === priceRange
      );
      return [...acc, ...matchingProps];
    }, []);

    return res.status(200).json(successResponse({
      count: matchingProperties.length,
      properties: matchingProperties
    }));
  } catch (error) {
    console.error('Search properties error:', error);
    return res.status(500).json(errorResponse('Server error while searching properties.'));
  }
};
