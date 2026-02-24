from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
import asyncio
import random
import json
import math

app = FastAPI(
    title="Asset Management API",
    description="API for frontend coding challenge",
    version="1.0.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for asset configurations
asset_configurations: Dict[str, dict] = {}

# Pydantic models for request/response validation
class Asset(BaseModel):
    id: str
    name: str
    type: str
    location: str
    status: str
    last_updated: str

class Telemetry(BaseModel):
    asset_id: str
    timestamp: str
    temperature: float
    pressure: float
    vibration: float
    power_consumption: float
    status: str

# Enums for configuration
class PriorityLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

class MaintenanceMode(str, Enum):
    scheduled = "scheduled"
    predictive = "predictive"
    reactive = "reactive"

class OperatingMode(str, Enum):
    continuous = "continuous"
    intermittent = "intermittent"
    on_demand = "on_demand"

class AssetConfiguration(BaseModel):
    asset_id: str = Field(..., min_length=1, max_length=50, description="Unique asset identifier")
    name: str = Field(..., min_length=3, max_length=100, description="Asset name")
    
    # Enum fields
    priority: PriorityLevel = Field(..., description="Asset priority level")
    maintenance_mode: MaintenanceMode = Field(..., description="Maintenance strategy")
    operating_mode: OperatingMode = Field(..., description="Operating mode")
    
    # Integer fields with various bounds
    maintenance_interval_days: int = Field(..., ge=1, le=365, description="Days between scheduled maintenance (1-365)")
    max_runtime_hours: int = Field(..., ge=1, le=100000, description="Maximum runtime hours before overhaul (must be positive)")
    warning_threshold_percent: int = Field(..., ge=0, le=100, description="Warning threshold as percentage (0-100)")
    
    # Float fields with various bounds
    max_temperature_celsius: float = Field(..., ge=-50, le=200, description="Maximum operating temperature in Celsius (-50 to 200)")
    max_pressure_psi: float = Field(..., ge=0, le=10000, description="Maximum operating pressure in PSI (must be positive)")
    efficiency_target_percent: float = Field(..., ge=0, le=100, description="Target efficiency percentage (0-100)")
    power_factor: float = Field(..., ge=-1.0, le=1.0, description="Power factor correction (-1.0 to 1.0)")
    load_capacity_percent: float = Field(..., ge=0, le=150, description="Maximum load capacity as percentage of rated capacity (0-150)")
    
    # String fields with validation
    alert_email: str = Field(..., description="Email address for alerts")
    location: str = Field(..., min_length=1, max_length=200, description="Physical location of asset")
    notes: Optional[str] = Field(None, max_length=500, description="Additional configuration notes")

    @validator('alert_email')
    def validate_email(cls, v):
        if '@' not in v or '.' not in v.split('@')[1]:
            raise ValueError('Invalid email address format')
        return v.lower()
    
    @validator('power_factor')
    def validate_power_factor(cls, v):
        if v == 0:
            raise ValueError('Power factor cannot be exactly zero')
        return v

class PowerDataPoint(BaseModel):
    timestamp: str
    power_kw: float
    efficiency: float

class PowerHistory(BaseModel):
    asset_id: str
    asset_name: str
    asset_type: str
    history: List[PowerDataPoint]
    forecast: List[PowerDataPoint]
    metadata: Dict[str, Any]

# Static data
ASSETS = [
    {
        "id": "AST-001",
        "name": "Primary Cooling Pump",
        "type": "pump",
        "location": "Building A - Floor 1",
        "status": "operational",
        "last_updated": "2024-01-15T10:30:00Z"
    },
    {
        "id": "AST-002",
        "name": "Air Compressor Unit 1",
        "type": "compressor",
        "location": "Building B - Floor 2",
        "status": "operational",
        "last_updated": "2024-01-15T10:28:00Z"
    },
    {
        "id": "AST-003",
        "name": "Backup Generator",
        "type": "generator",
        "location": "Building C - Basement",
        "status": "standby",
        "last_updated": "2024-01-15T09:15:00Z"
    },
    {
        "id": "AST-004",
        "name": "Hydraulic Motor 5",
        "type": "motor",
        "location": "Building A - Floor 3",
        "status": "maintenance",
        "last_updated": "2024-01-14T16:45:00Z"
    },
    {
        "id": "AST-005",
        "name": "Wind Turbine Alpha",
        "type": "turbine",
        "location": "Rooftop - Building D",
        "status": "operational",
        "last_updated": "2024-01-15T10:32:00Z"
    }
]

# Helper functions for power consumption patterns
def get_base_power_for_asset(asset_type: str, status: str) -> float:
    """Get base power consumption in kW based on asset type"""
    base_power = {
        "pump": 15.0,
        "compressor": 45.0,
        "generator": -100.0,  # Negative for power generation
        "motor": 25.0,
        "turbine": -200.0  # Negative for power generation
    }
    power = base_power.get(asset_type, 50.0)
    
    # Reduce power for non-operational assets
    if status == "standby":
        power = power * 0.1
    elif status == "maintenance":
        power = 0.0
    
    return power

def generate_power_history_and_forecast(asset_id: str) -> dict:
    """Generate 8 hours of historical data and 16 hours of forecast data"""
    asset = next((a for a in ASSETS if a["id"] == asset_id), None)
    if not asset:
        return None
    
    asset_type = asset["type"]
    status = asset["status"]
    base_power = get_base_power_for_asset(asset_type, status)
    
    # Generate historical data (8 hours, 15-minute intervals = 32 data points)
    history = []
    now = datetime.utcnow()
    
    for i in range(32):
        # Go back in time from now
        timestamp = now - timedelta(hours=8) + timedelta(minutes=15 * i)
        
        # Add time-of-day variation (higher during day, lower at night)
        hour = timestamp.hour
        time_factor = 1.0 + 0.3 * math.sin((hour - 6) * math.pi / 12)
        
        # Add some random noise
        noise = random.uniform(-0.15, 0.15)
        
        # Calculate power with variations
        power = base_power * time_factor * (1 + noise)
        
        # Calculate efficiency (between 70-95% for operational, lower for others)
        if status == "operational":
            base_efficiency = 85.0
            efficiency = base_efficiency + random.uniform(-10, 10)
        elif status == "standby":
            efficiency = random.uniform(20, 40)
        else:  # maintenance
            efficiency = 0.0
        
        history.append({
            "timestamp": timestamp.isoformat() + "Z",
            "power_kw": round(power, 2),
            "efficiency": round(max(0, min(100, efficiency)), 1)
        })
    
    # Generate forecast data (16 hours, 30-minute intervals = 32 data points)
    forecast = []
    
    for i in range(32):
        timestamp = now + timedelta(minutes=30 * i)
        
        # Forecast shows expected pattern with less noise
        hour = timestamp.hour
        time_factor = 1.0 + 0.3 * math.sin((hour - 6) * math.pi / 12)
        
        # Smaller noise for forecast
        noise = random.uniform(-0.08, 0.08)
        
        # Add trend - slight increase over time for power consumers, decrease for generators
        trend = 0.02 * i / 32 if base_power > 0 else -0.02 * i / 32
        
        power = base_power * time_factor * (1 + noise + trend)
        
        # Forecast efficiency remains relatively stable
        if status == "operational":
            efficiency = 85.0 + random.uniform(-5, 5)
        elif status == "standby":
            efficiency = 30.0 + random.uniform(-5, 5)
        else:
            efficiency = 0.0
        
        forecast.append({
            "timestamp": timestamp.isoformat() + "Z",
            "power_kw": round(power, 2),
            "efficiency": round(max(0, min(100, efficiency)), 1)
        })
    
    # Calculate metadata
    avg_historical_power = sum(h["power_kw"] for h in history) / len(history)
    avg_forecast_power = sum(f["power_kw"] for f in forecast) / len(forecast)
    avg_efficiency = sum(h["efficiency"] for h in history) / len(history)
    
    peak_power = max(h["power_kw"] for h in history)
    min_power = min(h["power_kw"] for h in history)
    
    return {
        "asset_id": asset_id,
        "asset_name": asset["name"],
        "asset_type": asset_type,
        "history": history,
        "forecast": forecast,
        "metadata": {
            "status": status,
            "history_period_hours": 8,
            "forecast_period_hours": 16,
            "avg_historical_power_kw": round(avg_historical_power, 2),
            "avg_forecast_power_kw": round(avg_forecast_power, 2),
            "avg_efficiency_percent": round(avg_efficiency, 1),
            "peak_power_kw": round(peak_power, 2),
            "min_power_kw": round(min_power, 2),
            "is_generator": base_power < 0,
            "unit": "kW"
        }
    }

# Helper function to generate random telemetry data
def generate_telemetry(asset_id: str) -> dict:
    asset = next((a for a in ASSETS if a["id"] == asset_id), None)
    if not asset:
        return None
    
    # Generate realistic values based on asset type and status
    status = asset["status"]
    asset_type = asset["type"]
    
    base_temp = {"pump": 45, "compressor": 65, "generator": 75, "motor": 55, "turbine": 35}
    base_pressure = {"pump": 120, "compressor": 150, "generator": 80, "motor": 90, "turbine": 60}
    base_vibration = {"pump": 2.5, "compressor": 4.0, "generator": 3.5, "motor": 2.0, "turbine": 5.5}
    base_power = {"pump": 15, "compressor": 45, "generator": 100, "motor": 25, "turbine": 200}
    
    temp_variance = 10 if status == "operational" else 5
    pressure_variance = 20 if status == "operational" else 10
    
    return {
        "asset_id": asset_id,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "temperature": round(base_temp.get(asset_type, 50) + random.uniform(-temp_variance, temp_variance), 2),
        "pressure": round(base_pressure.get(asset_type, 100) + random.uniform(-pressure_variance, pressure_variance), 2),
        "vibration": round(base_vibration.get(asset_type, 3.0) + random.uniform(-1, 1), 2),
        "power_consumption": round(base_power.get(asset_type, 50) + random.uniform(-10, 10), 2),
        "status": status
    }

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                pass

manager = ConnectionManager()

# API Endpoints

@app.get("/")
async def root():
    return {
        "message": "Asset Management API",
        "version": "1.0.0",
        "endpoints": {
            "assets": "/api/assets",
            "telemetry": "/api/telemetry/{asset_id}",
            "power_data": "/api/power/{asset_id}",
            "configuration": "/api/configuration",
            "websocket": "/ws/telemetry"
        }
    }

@app.get("/api/assets", response_model=List[Asset])
async def get_assets():
    """Get list of all assets (static data)"""
    return ASSETS

@app.get("/api/assets/{asset_id}", response_model=Asset)
async def get_asset(asset_id: str):
    """Get a specific asset by ID"""
    asset = next((a for a in ASSETS if a["id"] == asset_id), None)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset

@app.get("/api/telemetry/{asset_id}", response_model=Telemetry)
async def get_telemetry(asset_id: str):
    """Get current telemetry data for a specific asset (dynamic data)"""
    telemetry = generate_telemetry(asset_id)
    if not telemetry:
        raise HTTPException(status_code=404, detail="Asset not found")
    return telemetry

@app.get("/api/power/{asset_id}", response_model=PowerHistory)
async def get_power_data(asset_id: str):
    """
    Get power consumption history (8 hours) and forecast (16 hours) for an asset.
    
    Returns time-series data suitable for charting/graphing:
    - Historical data: 8 hours of actual power consumption at 15-minute intervals
    - Forecast data: 16 hours of predicted power consumption at 30-minute intervals
    - Metadata: Summary statistics and asset information
    
    Power values are in kilowatts (kW):
    - Positive values indicate power consumption
    - Negative values indicate power generation (for generators and turbines)
    
    Efficiency is shown as a percentage (0-100%)
    """
    power_data = generate_power_history_and_forecast(asset_id)
    if not power_data:
        raise HTTPException(status_code=404, detail="Asset not found")
    return power_data

class ConfigurationListResponse(BaseModel):
    configurations: List[AssetConfiguration]
    count: int

@app.get("/api/configuration/{asset_id}", response_model=AssetConfiguration)
async def get_configuration(asset_id: str):
    """Get stored configuration for a specific asset"""
    if asset_id not in asset_configurations:
        raise HTTPException(status_code=404, detail="Configuration not found for this asset")
    return asset_configurations[asset_id]

@app.get("/api/configurations", response_model=ConfigurationListResponse)
async def get_all_configurations():
    """Get all stored asset configurations"""
    return {
        "configurations": list(asset_configurations.values()),
        "count": len(asset_configurations)
    }

@app.post("/api/configuration", response_model=AssetConfiguration)
async def create_configuration(config: AssetConfiguration):
    """
    Create or update asset configuration with comprehensive validation.
    
    This endpoint expects a structured configuration object with:
    
    Enums:
    - priority: low | medium | high | critical
    - maintenance_mode: scheduled | predictive | reactive
    - operating_mode: continuous | intermittent | on_demand
    
    Integers with bounds:
    - maintenance_interval_days: 1-365
    - max_runtime_hours: 1-100,000
    - warning_threshold_percent: 0-100
    
    Floats with bounds:
    - max_temperature_celsius: -50.0 to 200.0
    - max_pressure_psi: 0.0 to 10,000.0 (must be positive)
    - efficiency_target_percent: 0.0 to 100.0
    - power_factor: -1.0 to 1.0 (cannot be exactly 0)
    - load_capacity_percent: 0.0 to 150.0
    
    Strings:
    - asset_id: 1-50 chars (must be valid existing asset)
    - name: 3-100 chars
    - alert_email: Valid email format
    - location: 1-200 chars
    - notes: Optional, max 500 chars
    """
    # Verify the asset exists
    asset = next((a for a in ASSETS if a["id"] == config.asset_id), None)
    if not asset:
        raise HTTPException(
            status_code=400, 
            detail=f"Asset {config.asset_id} does not exist. Please use a valid asset ID from /api/assets"
        )
    
    # Store the configuration
    asset_configurations[config.asset_id] = config.dict()
    
    return config

@app.delete("/api/configuration/{asset_id}")
async def delete_configuration(asset_id: str):
    """Delete configuration for a specific asset"""
    if asset_id not in asset_configurations:
        raise HTTPException(status_code=404, detail="Configuration not found for this asset")
    
    deleted_config = asset_configurations.pop(asset_id)
    return {"message": "Configuration deleted successfully", "deleted": deleted_config}

@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    """
    WebSocket endpoint that pushes live telemetry updates for all assets.
    Sends updates every 2 seconds.
    """
    await manager.connect(websocket)
    try:
        while True:
            # Generate telemetry for all operational assets
            telemetry_data = []
            for asset in ASSETS:
                telemetry = generate_telemetry(asset["id"])
                if telemetry:
                    telemetry_data.append(telemetry)
            
            # Send telemetry data to all connected clients
            await manager.broadcast(json.dumps({
                "type": "telemetry_update",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "data": telemetry_data
            }))
            
            await asyncio.sleep(2)  # Update every 2 seconds
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
