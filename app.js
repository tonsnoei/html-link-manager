// Global variables
let groups = JSON.parse(localStorage.getItem('linkbox_groups')) || [];
let currentGroupId = null;
let currentLinkId = null;

// DOM elements
const groupModal = document.getElementById('groupModal');
const linkModal = document.getElementById('linkModal');
const groupForm = document.getElementById('groupForm');
const linkForm = document.getElementById('linkForm');
const groupsContainer = document.getElementById('groupsContainer');
const addGroupBtn = document.getElementById('addGroupBtn');
const cancelGroupBtn = document.getElementById('cancelGroupBtn');
const deleteGroupBtn = document.getElementById('deleteGroupBtn');
const cancelLinkBtn = document.getElementById('cancelLinkBtn');
const deleteLinkBtn = document.getElementById('deleteLinkBtn');

// Initialize app
function initApp() {
    renderGroups();
    setupEventListeners();
}

// Render all groups to the page
function renderGroups() {
    groupsContainer.innerHTML = '';
    
    groups.forEach(group => {
        const groupElement = document.createElement('div');
        groupElement.className = 'group-box';
        groupElement.innerHTML = `
            <div class="group-header">
                <h2>${group.name}</h2>
                <div class="group-actions">
                    <button class="edit-group" data-group-id="${group.id}">✏️</button>
                    <button class="delete-group" data-group-id="${group.id}">🗑️</button>
                </div>
            </div>
            <ul class="link-list">
                ${group.links.map(link => `
                    <li class="link-item">
                        <div class="link-info">
                            <a href="${link.url}" target="_blank">${link.title}</a>
                        </div>
                        <div class="link-actions">
                            <button class="edit-link" 
                                data-group-id="${group.id}" 
                                data-link-id="${link.id}">✏️</button>
                            <button class="delete-link" 
                                data-group-id="${group.id}" 
                                data-link-id="${link.id}">🗑️</button>
                        </div>
                    </li>
                `).join('')}
            </ul>
            <button class="add-link" data-group-id="${group.id}">+ Add Link</button>
        `;
        groupsContainer.appendChild(groupElement);
    });
}

// Event listeners setup
function setupEventListeners() {
    addGroupBtn.addEventListener('click', () => openGroupModal());
    
    cancelGroupBtn.addEventListener('click', () => groupModal.close());
    cancelLinkBtn.addEventListener('click', () => linkModal.close());
    
    deleteGroupBtn.addEventListener('click', deleteGroup);
    deleteLinkBtn.addEventListener('click', deleteLink);
    
    groupForm.addEventListener('submit', saveGroup);
    linkForm.addEventListener('submit', saveLink);
    
    groupsContainer.addEventListener('click', handleContainerClick);
}

// Handle clicks on groups container
function handleContainerClick(e) {
    // Edit group
    if (e.target.classList.contains('edit-group')) {
        const groupId = e.target.dataset.groupId;
        openGroupModal(groupId);
    }
    // Delete group
    else if (e.target.classList.contains('delete-group')) {
        const groupId = e.target.dataset.groupId;
        deleteGroup(groupId);
    }
    // Add link
    else if (e.target.classList.contains('add-link')) {
        const groupId = e.target.dataset.groupId;
        openLinkModal(groupId);
    }
    // Edit link
    else if (e.target.classList.contains('edit-link')) {
        const groupId = e.target.dataset.groupId;
        const linkId = e.target.dataset.linkId;
        openLinkModal(groupId, linkId);
    }
    // Delete link
    else if (e.target.classList.contains('delete-link')) {
        const groupId = e.target.dataset.groupId;
        const linkId = e.target.dataset.linkId;
        deleteLink(groupId, linkId);
    }
}

// Open group modal for add/edit
function openGroupModal(groupId = null) {
    currentGroupId = groupId;
    const groupNameInput = document.getElementById('groupName');
    
    if (groupId) {
        const group = groups.find(g => g.id === groupId);
        groupNameInput.value = group.name;
        deleteGroupBtn.style.display = 'block';
    } else {
        groupNameInput.value = '';
        deleteGroupBtn.style.display = 'none';
    }
    
    groupModal.showModal();
}

// Open link modal for add/edit
function openLinkModal(groupId, linkId = null) {
    currentGroupId = groupId;
    currentLinkId = linkId;
    const linkTitleInput = document.getElementById('linkTitle');
    const linkUrlInput = document.getElementById('linkUrl');
    
    if (linkId) {
        const group = groups.find(g => g.id === groupId);
        const link = group.links.find(l => l.id === linkId);
        linkTitleInput.value = link.title;
        linkUrlInput.value = link.url;
        deleteLinkBtn.style.display = 'block';
    } else {
        linkTitleInput.value = '';
        linkUrlInput.value = '';
        deleteLinkBtn.style.display = 'none';
    }
    
    linkModal.showModal();
}

// Save group (create or update)
function saveGroup(e) {
    e.preventDefault();
    const groupNameInput = document.getElementById('groupName');
    const name = groupNameInput.value.trim();
    
    if (!name) return;
    
    if (currentGroupId) {
        // Update existing group
        const group = groups.find(g => g.id === currentGroupId);
        group.name = name;
    } else {
        // Create new group
        const newGroup = {
            id: Date.now().toString(),
            name: name,
            links: []
        };
        groups.push(newGroup);
    }
    
    saveToLocalStorage();
    renderGroups();
    groupModal.close();
}

// Save link (create or update)
function saveLink(e) {
    e.preventDefault();
    const linkTitleInput = document.getElementById('linkTitle');
    const linkUrlInput = document.getElementById('linkUrl');
    const title = linkTitleInput.value.trim();
    const url = linkUrlInput.value.trim();
    
    if (!title || !url) return;
    
    const group = groups.find(g => g.id === currentGroupId);
    
    if (currentLinkId) {
        // Update existing link
        const link = group.links.find(l => l.id === currentLinkId);
        link.title = title;
        link.url = url;
    } else {
        // Create new link
        const newLink = {
            id: Date.now().toString(),
            title: title,
            url: url
        };
        group.links.push(newLink);
    }
    
    saveToLocalStorage();
    renderGroups();
    linkModal.close();
}

// Delete current group
function deleteGroup(groupId = null) {
    if (!groupId) groupId = currentGroupId;
    
    if (confirm('Are you sure you want to delete this group and all its links?')) {
        groups = groups.filter(g => g.id !== groupId);
        saveToLocalStorage();
        renderGroups();
        groupModal.close();
    }
}

// Delete current link
function deleteLink(groupId = null, linkId = null) {
    if (!groupId || !linkId) {
        groupId = currentGroupId;
        linkId = currentLinkId;
    }
    
    if (confirm('Are you sure you want to delete this link?')) {
        const group = groups.find(g => g.id === groupId);
        group.links = group.links.filter(l => l.id !== linkId);
        saveToLocalStorage();
        renderGroups();
        linkModal.close();
    }
}

// Save groups to local storage
function saveToLocalStorage() {
    localStorage.setItem('linkbox_groups', JSON.stringify(groups));
}

// Initialize the application
initApp();
