// Global variables
let groups = JSON.parse(localStorage.getItem('linkbox_groups')) || [];
let currentGroupId = null;
let currentLinkId = null;
let editMode = false;

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
const toggleEditModeBtn = document.getElementById('toggleEditMode');
const exportDataBtn = document.getElementById('exportDataBtn');
const importDataBtn = document.getElementById('importDataBtn');
const pageTitleElement = document.getElementById('page-title');
const editTitleBtn = document.getElementById('edit-title');

// Initialize app
function initApp() {
    // Load page title from localStorage if available
    const savedTitle = localStorage.getItem('linkbox_title');
    if (savedTitle) {
        document.title = savedTitle;
        pageTitleElement.textContent = savedTitle;
    }
    
    // Migrate existing groups to have subtitle field
    groups.forEach(group => {
        if (group.subtitle === undefined) {
            group.subtitle = '';
        }
    });
    
    updateEditModeState();
    renderGroups();
    setupEventListeners();
}

// Swap groups array based on drag and drop
function swapGroups(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;
    
    // Swap the groups
    [groups[fromIndex], groups[toIndex]] = [groups[toIndex], groups[fromIndex]];
    saveToLocalStorage();
}

// Update edit mode state and button text
function updateEditModeState() {
    toggleEditModeBtn.innerText = editMode ? "Edit Mode: On" : "Edit Mode: Off";
    // Show/hide title edit button based on edit mode
    editTitleBtn.style.display = editMode ? 'inline-block' : 'none';
}

// Render all groups to the page
function renderGroups() {
    groupsContainer.innerHTML = '';
    
    groups.forEach((group, index) => {
        const groupElement = document.createElement('div');
        groupElement.className = 'group-box';
        groupElement.setAttribute('data-group-index', index);
        groupElement.innerHTML = `
            <div class="group-header">
                ${editMode ? '<div class="drag-handle" style="margin-right: 10px;">☰</div>' : ''}
                <h2>${group.name}</h2>
                ${editMode ? `
                <div class="group-actions">
                    <button class="edit-group" data-group-id="${group.id}">✏️</button>
                    <button class="delete-group" data-group-id="${group.id}">🗑️</button>
                </div>
                ` : ''}
            </div>
            <div class="group-subtitle">${group.subtitle}</div>
            <ul class="link-list">
                ${group.links.map((link, linkIndex) => `
                    <li class="link-item">
                        <div class="link-info">
                            <a href="${link.url}" target="_blank">${link.title}</a>
                        </div>
                        ${editMode ? `
                        <div class="link-actions">
                            <div class="move-buttons">
                                <button class="move-up" ${linkIndex === 0 ? 'disabled' : ''}
                                    data-group-id="${group.id}" 
                                    data-link-index="${linkIndex}">▲</button>
                                <button class="move-down" ${linkIndex === group.links.length - 1 ? 'disabled' : ''}
                                    data-group-id="${group.id}" 
                                    data-link-index="${linkIndex}">▼</button>
                            </div>
                            <button class="edit-link" 
                                data-group-id="${group.id}" 
                                data-link-id="${link.id}">✏️</button>
                            <button class="delete-link" 
                                data-group-id="${group.id}" 
                                data-link-id="${link.id}">🗑️</button>
                        </div>
                        ` : ''}
                    </li>
                `).join('')}
            </ul>
            ${editMode ? `<button class="add-link" data-group-id="${group.id}">+ Add Link</button>` : ''}
        `;
        
        // Make only draggable in edit mode
        groupElement.setAttribute('draggable', editMode);
        groupsContainer.appendChild(groupElement);
    });
    
    if (!editMode) {
        // Cleanup any leftover event listeners for non-edit mode
        groupsContainer.removeEventListener('dragstart', handleDragStart);
        groupsContainer.removeEventListener('dragover', handleDragOver);
        groupsContainer.removeEventListener('dragleave', handleDragLeave);
        groupsContainer.removeEventListener('drop', handleDrop);
        groupsContainer.removeEventListener('dragend', handleDragEnd);
    }
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
    
    toggleEditModeBtn.addEventListener('click', toggleEditMode);
    
    exportDataBtn.addEventListener('click', exportData);
    importDataBtn.addEventListener('click', importData);
    
    // Add event listener for title edit button
    editTitleBtn.addEventListener('click', handleTitleEdit);
    
    // Setup drag and drop events if in edit mode
    groupsContainer.addEventListener('dragstart', handleDragStart);
    groupsContainer.addEventListener('dragover', handleDragOver);
    groupsContainer.addEventListener('dragleave', handleDragLeave);
    groupsContainer.addEventListener('drop', handleDrop);
    groupsContainer.addEventListener('dragend', handleDragEnd);
}

// Toggle edit mode
function toggleEditMode() {
    editMode = !editMode;
    updateEditModeState();
    renderGroups();  // Re-render to show/hide CRUD buttons
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
    // Move link up
    else if (e.target.classList.contains('move-up')) {
        const groupId = e.target.dataset.groupId;
        const linkIndex = parseInt(e.target.dataset.linkIndex);
        moveLinkUp(groupId, linkIndex);
    }
    // Move link down
    else if (e.target.classList.contains('move-down')) {
        const groupId = e.target.dataset.groupId;
        const linkIndex = parseInt(e.target.dataset.linkIndex);
        moveLinkDown(groupId, linkIndex);
    }
}

// Open group modal for add/edit
function openGroupModal(groupId = null) {
    currentGroupId = groupId;
    const groupNameInput = document.getElementById('groupName');
    const groupSubtitleInput = document.getElementById('groupSubtitle');
    
    if (groupId) {
        const group = groups.find(g => g.id === groupId);
        groupNameInput.value = group.name;
        groupSubtitleInput.value = group.subtitle;
        deleteGroupBtn.style.display = 'block';
    } else {
        groupNameInput.value = '';
        groupSubtitleInput.value = '';
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
        group.subtitle = document.getElementById('groupSubtitle').value;
    } else {
        // Create new group
        const newGroup = {
            id: Date.now().toString(),
            name: name,
            subtitle: document.getElementById('groupSubtitle').value,
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

// Move link up in group
function moveLinkUp(groupId, linkIndex) {
    const group = groups.find(g => g.id === groupId);
    if (linkIndex === 0) return;
    
    // Swap with previous
    [group.links[linkIndex], group.links[linkIndex-1]] = 
        [group.links[linkIndex-1], group.links[linkIndex]];
    
    saveToLocalStorage();
    renderGroups();
}

// Move link down in group
function moveLinkDown(groupId, linkIndex) {
    const group = groups.find(g => g.id === groupId);
    if (linkIndex === group.links.length - 1) return;
    
    // Swap with next
    [group.links[linkIndex], group.links[linkIndex+1]] = 
        [group.links[linkIndex+1], group.links[linkIndex]];
    
    saveToLocalStorage();
    renderGroups();
}

// Drag and drop handlers
let draggedIndex = null;

function handleDragStart(e) {
    if (!editMode) return;
    
    const groupBox = e.target.closest('.group-box');
    if (!groupBox) return;
    
    draggedIndex = parseInt(groupBox.getAttribute('data-group-index'));
    groupBox.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedIndex);
}

function handleDragOver(e) {
    if (!editMode) return;
    e.preventDefault();
    
    const groupBox = e.target.closest('.group-box');
    if (groupBox) {
        groupBox.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    if (!editMode) return;
    
    const groupBox = e.target.closest('.group-box');
    if (groupBox) {
        groupBox.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    if (!editMode) return;
    
    const groupBox = e.target.closest('.group-box');
    if (!groupBox) return;
    
    const dropIndex = parseInt(groupBox.getAttribute('data-group-index'));
    const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    groupBox.classList.remove('drag-over');
    
    // Temporarily highlight the drop target
    groupBox.classList.add('drag-target-highlight');
    setTimeout(() => groupBox.classList.remove('drag-target-highlight'), 1000);
    
    swapGroups(draggedIndex, dropIndex);
    renderGroups();
}

function handleDragEnd(e) {
    if (!editMode) return;
    
    const groupBox = e.target.closest('.group-box');
    if (groupBox) {
        groupBox.classList.remove('dragging');
    }
    
    // Cleanup all drag-over effects
    document.querySelectorAll('.group-box').forEach(box => {
        box.classList.remove('drag-over');
    });
}

// Export data to JSON file
function exportData() {
    const data = JSON.stringify(groups, null, 2);
    const blob = new Blob([data], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'linkbox_export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Import data from JSON file
function importData() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                if (!Array.isArray(importedData)) {
                    throw new Error('Imported data is not an array');
                }
                
                groups = importedData;
                saveToLocalStorage();
                alert('Data imported successfully!');
                renderGroups();
            } catch (error) {
                alert('Error importing data: ' + error.message);
            }
        };
        reader.readAsText(file);
    });
    fileInput.click();
}

// Save groups to local storage
function saveToLocalStorage() {
    localStorage.setItem('linkbox_groups', JSON.stringify(groups));
}

// Edit page title handler
function handleTitleEdit() {
    const currentTitle = pageTitleElement.textContent;
    const newTitle = prompt('Enter new page title:', currentTitle);
    
    if (newTitle === null) return; // User canceled prompt
    
    const trimmedTitle = newTitle.trim();
    if (trimmedTitle) {
        // Update title in the header
        pageTitleElement.textContent = trimmedTitle;
        // Update document title
        document.title = trimmedTitle;
        // Save to localStorage
        localStorage.setItem('linkbox_title', trimmedTitle);
    }
}

// Initialize the application
initApp();
