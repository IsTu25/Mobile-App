const TrackingSession = require('../models/tracking-session.model');

/**
 * Start a new tracking session
 */
exports.startSession = async (userId) => {
    // Deactivate any existing active sessions
    await TrackingSession.updateMany(
        { user: userId, active: true },
        { $set: { active: false, endTime: new Date() } }
    );

    const session = new TrackingSession({
        user: userId,
        active: true
    });

    await session.save();
    return session;
};

/**
 * Update location for a session
 */
exports.updateLocation = async (sessionId, locationData) => {
    const session = await TrackingSession.findById(sessionId);

    if (!session || !session.active) {
        throw new Error('Session not found or inactive');
    }

    // Update current location
    session.currentLocation = {
        ...locationData,
        timestamp: new Date()
    };
    session.lastUpdated = new Date();

    // Add to path history
    session.path.push({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        timestamp: new Date()
    });

    await session.save();
    return session;
};

/**
 * Stop a session
 */
exports.stopSession = async (sessionId) => {
    const session = await TrackingSession.findByIdAndUpdate(
        sessionId,
        {
            active: false,
            endTime: new Date()
        },
        { new: true }
    );
    return session;
};

/**
 * Get session details
 */
exports.getSession = async (sessionId) => {
    return await TrackingSession.findById(sessionId)
        .populate('user', 'fullName phone email')
        .lean();
};
