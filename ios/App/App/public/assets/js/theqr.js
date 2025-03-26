/**
 * QR Code generation and validation utilities
 */

var theqr = {
  /**
   * Display QR code in the specified elements
   * @param {string} code - The code to encode in the QR
   */
  display: function(code) {
    $('.qr-code, .qr-focus-code').empty().qrcode(code);
    $('.qr-code canvas, .qr-focus-code canvas').css({ visibility: 'hidden', overflow: 'hidden', width: '1px', height: '1px' });
    var background_image = $('.qr-code canvas, .qr-focus-code canvas')[0].toDataURL();
    $('.qr-code, .qr-focus-code').css({ backgroundImage: `url(${background_image})` });
  },
  
  /**
   * Generate a QR code with security hash
   * @param {string} alias - Unit alias
   * @param {string|number} id - User ID
   * @param {string} type - Type of QR code ('U' for user)
   * @param {Object} data_in - Data to encode in the QR
   * @returns {string} - The generated QR code
   */
  generate_qr_code_raw: function(alias, id, type, data_in) {
    data = Math.floor(Math.random() * 0x00eff + 0x0100).toString(16) + btoa(JSON.stringify(data_in));
    var correct_hash = sha1('stqmhbty7dml4rf' + alias + 'y51ua' + id + 'cwqhz' + data + 'cr4mz' + type + 'vfzs2adrky');
    var security = correct_hash + data;
    var code = `${alias}-${id}-${type}${security}`;
    return code;
  },
  
  /**
   * Validate a QR code
   * @param {string} code - The QR code to validate
   * @returns {Object} - Validation result with is_valid flag and message
   */
  is_qr_code_valid: function(code) {
    var temp_raw = code.split('-');
    if (temp_raw.length <= 2) return { 'is_valid': false, 'message': 'Invalid Security Code' };
    
    var security = temp_raw.pop();
    var id = temp_raw.pop();
    var alias = temp_raw.join('-');
    
    var type = security.substr(0, 1);
    var hash = security.substr(1, 40);
    var data = security.substr(41);
    
    var correct_hash = sha1('stqmhbty7dml4rf' + alias + 'y51ua' + id + 'cwqhz' + data + 'cr4mz' + type + 'vfzs2adrky');
    if (hash != correct_hash) return { 'is_valid': false, 'message': 'Invalid Security Code' };
    
    data = JSON.parse(atob(data.substr(3)));
    
    if (!moment().isSameOrAfter(moment(data.expected_date))) {
      var date_from = moment(data.expected_date).format('YYYY-MM-DD HH:mm:ss');
      var date_to = moment(data.expiry_date).format('YYYY-MM-DD HH:mm:ss');
      
      return { 'is_valid': false, 'message': 'Valid Only for ' + date_from + ' to ' + date_to + '.' };
    }
    
    if (!moment().isSameOrBefore(moment(data.expiry_date))) 
      return { 'is_valid': false, 'message': 'Expired Security Code' };
    
    return { 'is_valid': true, 'message': 'Correct', 'alias': alias, 'id': id, type: type, 'data': data };
  }
};