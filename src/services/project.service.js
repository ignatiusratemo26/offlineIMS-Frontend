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
    return api.getList(`${BASE_PATH}/${projectId}/members`);
  },
  
  addProjectMember: (projectId, memberData) => {
    return api.create(`${BASE_PATH}/${projectId}/members`, memberData);
  },
  
  removeProjectMember: (projectId, memberId) => {
    return api.delete(`${BASE_PATH}/${projectId}/members`, memberId);
  },
  
  updateProjectMember: (projectId, memberId, memberData) => {
    return api.update(`${BASE_PATH}/${projectId}/members`, memberId, memberData);
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
  
  // Project statistics
  getProjectStatistics: (projectId) => {
    return api.getById(`${BASE_PATH}/${projectId}/statistics`);
  }
};

export default projectService;