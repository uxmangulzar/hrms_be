const axios = require('axios');
const SettingService = require('./SettingService');

class ZoomService {
  /**
   * Get OAuth Access Token from Zoom using Server-to-Server OAuth
   */
  static async getAccessToken(company_id = null) {
    try {
      const accountIdSet = await SettingService.getSettingByKey('zoom_account_id', company_id);
      const clientIdSet = await SettingService.getSettingByKey('zoom_client_id', company_id);
      const clientSecretSet = await SettingService.getSettingByKey('zoom_client_secret', company_id);

      const accountId = accountIdSet ? accountIdSet.setting_value : process.env.ZOOM_ACOUNT_ID;
      const clientId = clientIdSet ? clientIdSet.setting_value : process.env.ZOOM_CLIENT_ID;
      const clientSecret = clientSecretSet ? clientSecretSet.setting_value : process.env.ZOOM_CLIENT_SECRET;

      if (!accountId || !clientId || !clientSecret) {
        throw new Error(`Zoom credentials missing for company ${company_id || 'Global'}`);
      }

      const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

      const response = await axios.post(
        `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
        {},
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return response.data.access_token;
    } catch (error) {
      console.error('Zoom Auth Error:', error.response?.data || error.message);
      throw new Error('Failed to get Zoom access token');
    }
  }

  /**
   * Create a Zoom Meeting
   * @param {Object} meetingConfig - { topic, start_time, duration, timezone, company_id }
   */
  static async createMeeting({ topic, start_time, duration, timezone = 'UTC', company_id = null }) {
    try {
      const accessToken = await this.getAccessToken(company_id);

      const response = await axios.post(
        'https://api.zoom.us/v2/users/me/meetings',
        {
          topic,
          type: 2, // Scheduled meeting
          start_time, // ISO 8601 format: 2024-03-09T15:00:00Z
          duration, // in minutes
          timezone,
          settings: {
            host_video: true,
            participant_video: true,
            join_before_host: false,
            mute_upon_entry: true,
            waiting_room: true,
            auto_recording: 'cloud', // Enable cloud recording
            enforce_login: false
          }
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        id: response.data.id,
        join_url: response.data.join_url,
        start_url: response.data.start_url,
        password: response.data.password,
        topic: response.data.topic,
        start_time: response.data.start_time
      };
    } catch (error) {
      console.error('Zoom Meeting Creation Error:', error.response?.data || error.message);
      throw new Error('Failed to create Zoom meeting');
    }
  }

  /**
   * Generate Signature for Zoom Web/Meeting SDK
   * @param {string|number} meetingNumber 
   * @param {number} role - 0 for participant, 1 for host
   * @param {number|null} company_id
   */
  static async generateSDKSignature(meetingNumber, role = 0, company_id = null) {
    const jwt = require('jsonwebtoken');
    const iat = Math.floor(Date.now() / 1000) - 60; // 60 seconds buffer
    const exp = iat + 60 * 60 * 2; // 2 hours

    const clientIdSet = await SettingService.getSettingByKey('zoom_client_id', company_id);
    const clientSecretSet = await SettingService.getSettingByKey('zoom_client_secret', company_id);

    const clientId = clientIdSet ? clientIdSet.setting_value : process.env.ZOOM_CLIENT_ID;
    const clientSecret = clientSecretSet ? clientSecretSet.setting_value : process.env.ZOOM_CLIENT_SECRET;

    // Clean meeting number to remove any spaces or hyphens from frontend
    const cleanMn = meetingNumber.toString().replace(/[^0-9]/g, '');

    const payload = {
      sdkKey: clientId,
      mn: Number(cleanMn),
      role: Number(role),
      iat: iat,
      exp: exp,
      tokenExp: exp
    };

    return {
      signature: jwt.sign(payload, clientSecret, { algorithm: 'HS256', noTimestamp: true }),
      sdkKey: clientId
    };
  }
}

module.exports = ZoomService;

