import api from './api';

const BASE_PATH = '/projects';

const projectService = {
  // Project endpoints
  getProjects: (params = {}) => {
    return api.getList(BASE_PATH, params);
  },
  
  getProjectById: (projectId) => {
    return api.getById(BASE_PATH, projectId);
  },
  
  createProject: (projectData) => {
    return api.create(BASE_PATH, projectData);
  },
  
  updateProject: (projectId, projectData) => {
    return api.update(BASE_PATH, projectId, projectData);
  },
  
  deleteProject: (projectId) => {
    return api.delete(BASE_PATH, projectId);
  },
  
  // Project members
  getProjectMembers: (projectId) => {
    return api.getList(`${BASE_PATH}/${projectId}/team_members`);
  },
  
  addProjectMember: (projectId, memberData) => {
    return api.create(`${BASE_PATH}/${projectId}/add_team_member`, memberData);
  },
  
  removeProjectMember: (projectId, memberId) => {
    return api.delete(`${BASE_PATH}/${projectId}/remove_team_member`, memberId);
  },
  
  updateProjectMember: (projectId, memberId, memberData) => {
    return api.update(`${BASE_PATH}/${projectId}/update_team_member`, memberId, memberData);
  },
  
  // Project documents
  getProjectDocuments: (projectId) => {
    return api.getList(`${BASE_PATH}/${projectId}/documents`);
  },
  
  getDocumentById: (projectId, documentId) => {
    return api.getById(`${BASE_PATH}/${projectId}/documents`, documentId);
  },
  
  uploadDocument: (projectId, title, description, file) => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('file', file);
    
    return api.uploadFile(`${BASE_PATH}/${projectId}/documents`, formData);
  },
  
  deleteDocument: (projectId, documentId) => {
    return api.delete(`${BASE_PATH}/${projectId}/documents`, documentId);
  },
  
  // Get project statistics - fixed to remove the undefined in URL
  getProjectStatistics: async (projectId) => {
    try {
      // Make sure projectId is defined and correct
      if (!projectId) {
        throw new Error('Project ID is required for fetching statistics');
      }
    
      return await api.getList(`${BASE_PATH}/${projectId}/statistics`, {});

    } catch (error) {
      console.error('Error fetching project statistics:', error);
      return {
        project_id: projectId,
        project_title: '',
        status: '',
        days_active: 0,
        days_remaining: null,
        team_size: 0,
        total_tasks: 0,
        completed_tasks: 0,
        task_completion_percentage: 0,
        total_documents: 0,
        resource_count: 0,
        created_by: {
          id: null,
          name: 'Unknown'
        },
        lab: ''
      };
    }
  },
  
  // Get tasks for a project
  getProjectTasks: async (projectId, params = {}) => {
    return api.getList(`${BASE_PATH}/${projectId}/tasks`, params);
  },
  
  // Create a new task for a project
  createProjectTask: async (projectId, taskData) => {
    return api.create(`${BASE_PATH}/${projectId}/tasks`, taskData);
  },
  
  // Update a task
  updateProjectTask: async (projectId, taskId, taskData) => {
    return api.update(`${BASE_PATH}/${projectId}/tasks`, taskId, taskData);
  },
  
  // Delete a task
  deleteProjectTask: async (projectId, taskId) => {
    return api.delete(`${BASE_PATH}/${projectId}/tasks`, taskId);
  },
  // Get all documents across projects (for DocumentList component)
  getAllDocuments: (params = {}) => {
    return api.getList(`${BASE_PATH}/documents`, params);
  }
};

export default projectService;