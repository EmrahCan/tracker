const mongoose = require('mongoose');

const coordinateSchema = new mongoose.Schema({
  lat: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  lng: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  }
});

const missileSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true,
    enum: ['ballistic', 'cruise', 'interceptor', 'drone']
  },
  origin: {
    type: coordinateSchema,
    required: true
  },
  target: {
    type: coordinateSchema,
    required: true
  },
  currentPosition: {
    type: coordinateSchema,
    required: true
  },
  trajectory: [{
    type: coordinateSchema
  }],
  status: {
    type: String,
    required: true,
    enum: ['launched', 'in-flight', 'intercepted', 'impact', 'failed'],
    default: 'launched'
  },
  speed: {
    type: Number,
    required: true,
    min: 0
  },
  altitude: {
    type: Number,
    default: 0
  },
  launchTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  estimatedImpactTime: {
    type: Date,
    required: true
  },
  actualImpactTime: {
    type: Date
  },
  country: {
    type: String,
    required: true,
    enum: ['israel', 'iran', 'other']
  },
  threat_level: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  metadata: {
    range: Number,
    warhead_type: String,
    interceptor_id: String,
    source: String,
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.8
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for flight duration
missileSchema.virtual('flightDuration').get(function() {
  if (this.actualImpactTime) {
    return this.actualImpactTime - this.launchTime;
  }
  return Date.now() - this.launchTime;
});

// Virtual for remaining time
missileSchema.virtual('remainingTime').get(function() {
  if (this.status === 'in-flight') {
    return Math.max(0, this.estimatedImpactTime - Date.now());
  }
  return 0;
});

// Virtual for progress percentage
missileSchema.virtual('progress').get(function() {
  const totalTime = this.estimatedImpactTime - this.launchTime;
  const elapsedTime = Date.now() - this.launchTime;
  return Math.min(100, Math.max(0, (elapsedTime / totalTime) * 100));
});

// Index for efficient queries
missileSchema.index({ status: 1, launchTime: -1 });
missileSchema.index({ country: 1, status: 1 });
missileSchema.index({ launchTime: -1 });

// Static methods
missileSchema.statics.getActiveMissiles = function() {
  return this.find({ 
    status: { $in: ['launched', 'in-flight'] }
  }).sort({ launchTime: -1 });
};

missileSchema.statics.getRecentMissiles = function(hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  return this.find({ 
    launchTime: { $gte: since }
  }).sort({ launchTime: -1 });
};

// Instance methods
missileSchema.methods.updatePosition = function(newPosition) {
  this.currentPosition = newPosition;
  this.trajectory.push(newPosition);
  return this.save();
};

missileSchema.methods.markAsIntercepted = function(interceptorId) {
  this.status = 'intercepted';
  this.actualImpactTime = new Date();
  this.metadata.interceptor_id = interceptorId;
  return this.save();
};

missileSchema.methods.markAsImpact = function() {
  this.status = 'impact';
  this.actualImpactTime = new Date();
  return this.save();
};

module.exports = mongoose.model('Missile', missileSchema);
