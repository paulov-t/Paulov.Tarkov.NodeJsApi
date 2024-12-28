var fs = require('fs');
var path = require('path');
var selfsigned = require('selfsigned');

/**
 * Generates a Https Certificate
 */
class CertGenerator {
  constructor() {
    this.certDir = path.resolve(process.cwd(), "./certs");
    this.certFile = path.resolve(this.certDir, "cert.pem");
    this.keyFile = path.resolve(this.certDir, "key.pem");
  }
  /**
   * Generates a Certificate
   * @param {string} serverIp 
   * @returns {object} { cert, key }
   */
  generate(serverIp) {

    if (fs.existsSync(this.certFile) && fs.existsSync(this.keyFile)) {
      const cert = fs.readFileSync(this.certFile);
      const key = fs.readFileSync(this.keyFile);
      return { cert, key };
    }

    // create directory if not exists
    if (!fs.existsSync(this.certDir)) {
      fs.mkdirSync(this.certDir);
      console.log('created directory %s', this.certDir);
    }

    let fingerprint, cert, key;

    ({
      cert,
      private: key,
      fingerprint,
    } = selfsigned.generate(null, {
      keySize: 2048, // the size for the private key in bits (default: 1024)
      days: 365, // how long till expiry of the signed certificate (default: 365)
      algorithm: "sha256", // sign the certificate with specified algorithm (default: 'sha1')
      // extensions: [{ name: "paulov-tarkov", cA: true, value: serverIp + "/" }], // certificate extensions array
      extensions: [{ name: "paulov-tarkov", cA: true }], // certificate extensions array
      pkcs7: true, // include PKCS#7 as part of the output (default: false)
      clientCertificate: true, // generate client cert signed by the original key (default: false)
      clientCertificateCN: "jdoe", // client certificate's common name (default: 'John Doe jdoe123')
    }));

    console.log(`Generated self-signed sha256/2048 certificate ${fingerprint}, valid 365 days`);

    fs.writeFileSync(this.certFile, cert);
    fs.writeFileSync(this.keyFile, key);

    return { cert, key };
  }
}

module.exports.certificate = new CertGenerator();