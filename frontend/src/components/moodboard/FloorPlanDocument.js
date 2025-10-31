import React, { useRef, useEffect, useState } from 'react';

export default function FloorPlanDocument({ moodboardId, sharedData, updateSharedData, paintCatalog }) {
    const canvasRef = useRef(null);
    
    useEffect(() => {
        drawFloorPlan();
    }, [sharedData]);
    
    const drawFloorPlan = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
        
        const scale = 40;
        const centerX = w / 2;
        const centerY = h / 2;
        const roomW = sharedData.roomDimensions.width * scale;
        const roomL = sharedData.roomDimensions.length * scale;
        
        // Walls
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 8;
        ctx.strokeRect(centerX - roomW/2, centerY - roomL/2, roomW, roomL);
        
        // Grid
        ctx.strokeStyle = '#CCCCCC';
        ctx.lineWidth = 0.5;
        for (let i = 1; i < sharedData.roomDimensions.width; i++) {
            ctx.beginPath();
            ctx.moveTo(centerX - roomW/2 + i * scale, centerY - roomL/2);
            ctx.lineTo(centerX - roomW/2 + i * scale, centerY + roomL/2);
            ctx.stroke();
        }
        
        // Dimension lines
        ctx.strokeStyle = '#D4A574';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        ctx.beginPath();
        ctx.moveTo(centerX - roomW/2 - 40, centerY - roomL/2);
        ctx.lineTo(centerX - roomW/2 - 40, centerY + roomL/2);
        ctx.stroke();
        
        ctx.setLineDash([]);
        
        // Labels
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 16px Arial';
        ctx.save();
        ctx.translate(centerX - roomW/2 - 60, centerY);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(`${sharedData.roomDimensions.length}'`, 0, 0);
        ctx.restore();
        
        ctx.fillText(`${sharedData.roomDimensions.width}'`, centerX, centerY + roomL/2 + 50);
        
        // Furniture
        sharedData.furnitureItems.forEach(item => {
            const x = centerX + item.position_x * scale;
            const z = centerY + item.position_z * scale;
            ctx.fillStyle = '#8B7355';
            ctx.fillRect(x - 20, z - 20, 40, 40);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(x - 20, z - 20, 40, 40);
            ctx.fillStyle = '#000';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(item.name.substring(0, 10), x, z + 35);
        });
    };
    
    return (
        <div className="h-full flex">
            <div className="w-56 bg-gray-900/30 border-r border-[#D4A574]/30 p-3 overflow-y-auto">
                <div className="bg-gray-900/50 rounded p-3">
                    <h4 className="text-[#D4A574] font-bold mb-2">📏 Tools</h4>
                    <button className="w-full bg-gray-800 hover:bg-gray-700 text-[#D4C5A9] px-3 py-2 rounded mb-2 text-sm">Add Door</button>
                    <button className="w-full bg-gray-800 hover:bg-gray-700 text-[#D4C5A9] px-3 py-2 rounded mb-2 text-sm">Add Window</button>
                    <button className="w-full bg-gray-800 hover:bg-gray-700 text-[#D4C5A9] px-3 py-2 rounded text-sm">Add Wall</button>
                </div>
            </div>
            
            <div className="flex-1 bg-white relative overflow-hidden">
                <canvas ref={canvasRef} width={1800} height={1000} className="w-full h-full" />
                <div className="absolute top-4 left-4 bg-black/70 text-[#D4A574] px-4 py-2 rounded">📏 Floor Plan - Architectural View</div>
            </div>
        </div>
    );
}
