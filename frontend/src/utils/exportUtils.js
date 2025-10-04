// Export utilities for generating reports and PDFs

export const generateProjectSummary = (project) => {
  if (!project) return '';
  
  let summary = `PROJECT: ${project.name}\n`;
  summary += `Date: ${new Date().toLocaleDateString()}\n`;
  summary += `\n${'='.repeat(60)}\n\n`;
  
  project.rooms?.forEach((room) => {
    summary += `ROOM: ${room.name.toUpperCase()}\n`;
    summary += `${'-'.repeat(60)}\n`;
    
    room.categories?.forEach((category) => {
      summary += `  Category: ${category.name}\n`;
      
      let itemCount = 0;
      category.subcategories?.forEach((subcategory) => {
        subcategory.items?.forEach((item) => {
          itemCount++;
          summary += `    ${itemCount}. ${item.name}`;
          if (item.quantity) summary += ` (Qty: ${item.quantity})`;
          if (item.size) summary += ` [${item.size}]`;
          if (item.vendor) summary += ` - ${item.vendor}`;
          summary += `\n`;
        });
      });
      
      summary += `\n`;
    });
    
    summary += `\n`;
  });
  
  return summary;
};

export const exportToCSV = (project) => {
  if (!project) return '';
  
  let csv = 'Room,Category,Item Name,Quantity,Size,Vendor,SKU,Status,Notes\n';
  
  project.rooms?.forEach((room) => {
    room.categories?.forEach((category) => {
      category.subcategories?.forEach((subcategory) => {
        subcategory.items?.forEach((item) => {
          csv += `"${room.name}","${category.name}","${item.name || ''}",`;
          csv += `"${item.quantity || ''}","${item.size || ''}","${item.vendor || ''}",`;
          csv += `"${item.sku || ''}","${item.status || ''}","${item.notes || ''}"\n`;
        });
      });
    });
  });
  
  return csv;
};

export const downloadFile = (content, filename, type = 'text/plain') => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportProjectToCSV = (project) => {
  const csv = exportToCSV(project);
  const filename = `${project.name}_${new Date().toISOString().split('T')[0]}.csv`;
  downloadFile(csv, filename, 'text/csv');
};

export const exportProjectSummary = (project) => {
  const summary = generateProjectSummary(project);
  const filename = `${project.name}_summary_${new Date().toISOString().split('T')[0]}.txt`;
  downloadFile(summary, filename, 'text/plain');
};

export const calculateProjectStats = (project) => {
  if (!project) return null;
  
  let totalItems = 0;
  let totalRooms = project.rooms?.length || 0;
  let totalCategories = 0;
  let checkedItems = 0;
  let itemsByStatus = {};
  
  project.rooms?.forEach((room) => {
    totalCategories += room.categories?.length || 0;
    
    room.categories?.forEach((category) => {
      category.subcategories?.forEach((subcategory) => {
        subcategory.items?.forEach((item) => {
          totalItems++;
          if (item.checked) checkedItems++;
          
          const status = item.status || 'Not Set';
          itemsByStatus[status] = (itemsByStatus[status] || 0) + 1;
        });
      });
    });
  });
  
  return {
    totalRooms,
    totalCategories,
    totalItems,
    checkedItems,
    uncheckedItems: totalItems - checkedItems,
    completionPercentage: totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0,
    itemsByStatus
  };
};