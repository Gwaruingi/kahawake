# MongoDB Connection Troubleshooting Guide

This guide will help you diagnose and fix MongoDB connection issues in the job portal application.

## Common Connection Issues

### 1. Connection Refused (ECONNREFUSED)

**Symptoms:**
- Error messages containing "ECONNREFUSED"
- Application fails to start or shows database connection errors
- Job posting/editing features don't work

**Possible Causes:**
- MongoDB service is not running
- Incorrect MongoDB URI in environment variables
- Firewall blocking MongoDB connections

**Solutions:**
1. **Check if MongoDB is running:**
   ```
   # Windows
   net start MongoDB

   # Linux/macOS
   sudo systemctl status mongod
   ```

2. **Start MongoDB if it's not running:**
   ```
   # Windows
   net start MongoDB

   # Linux/macOS
   sudo systemctl start mongod
   ```

3. **Verify your MongoDB URI in .env.local:**
   - Ensure the format is correct: `mongodb://[username:password@]host[:port]/database`
   - For MongoDB Atlas: `mongodb+srv://username:password@cluster.mongodb.net/database`

4. **Check firewall settings:**
   - MongoDB uses port 27017 by default
   - Ensure this port is open if connecting to a remote MongoDB instance

### 2. Authentication Failed

**Symptoms:**
- Error messages containing "Authentication failed"
- Database operations fail after initial connection

**Solutions:**
1. **Verify credentials in your MongoDB URI:**
   - Check username and password in your connection string
   - Ensure special characters in passwords are properly URL-encoded

2. **Check database user permissions:**
   - Ensure the user has appropriate roles for the database

### 3. Server Selection Timeout

**Symptoms:**
- Error messages containing "ServerSelectionTimeoutError"
- Application hangs when trying to connect to the database

**Possible Causes:**
- Network issues
- MongoDB server is overloaded
- DNS resolution problems

**Solutions:**
1. **Check network connectivity:**
   - Ping the MongoDB host to verify network connectivity
   - Check if you can connect to the MongoDB server from another machine

2. **Increase timeout settings:**
   - The application already includes increased timeout settings in the connection code
   - For extreme cases, you can further increase the `serverSelectionTimeoutMS` value

3. **Use the local MongoDB fallback:**
   - The application will automatically try to connect to a local MongoDB instance if the primary connection fails
   - Ensure you have a local MongoDB instance running if you want to use this fallback

### 4. Topology Closed Errors

**Symptoms:**
- Error messages containing "MongoTopologyClosedError"
- Errors about "Topology was destroyed"

**Solutions:**
1. **Avoid reusing closed connections:**
   - The application now uses separate clients for connection testing
   - Ensure you're not manually closing MongoDB connections that might be reused later

2. **Check for connection pooling issues:**
   - If you're seeing these errors in development, it might be due to hot reloading
   - The application includes caching to prevent this issue

## Using the Database Monitoring Tools

### Connection Status API

The application includes a database status API endpoint that provides real-time information about the MongoDB connection:

- **Endpoint:** `/api/system/db-status`
- **Access:** Admin users only
- **Information provided:**
  - Current connection state
  - Last connected/disconnected timestamps
  - Recent connection errors
  - Current health check status

### Database Status Panel

For admin users, the application includes a database status panel that displays:

- Current connection status
- Connection history
- Recent errors
- Health check results

This panel automatically refreshes every 30 seconds and provides a visual indicator of database health.

### Connection Check Script

You can run the database connection check script to diagnose issues:

```
node scripts/check-db-connection.js
```

This script will:
1. Try to connect to MongoDB using your configured URI
2. Report any connection issues
3. Provide troubleshooting suggestions based on the error

## Environment Variables

The following environment variables control MongoDB connections:

- **MONGODB_URI** (required): Primary MongoDB connection string
- **LOCAL_MONGODB_URI** (optional): Fallback connection string for local MongoDB
  - Defaults to `mongodb://localhost:27017/job-portal` if not specified

## Advanced Troubleshooting

### Checking MongoDB Logs

MongoDB logs can provide detailed information about connection issues:

- **Windows:** Check the MongoDB logs in the Event Viewer or in the MongoDB log file
- **Linux/macOS:** Check `/var/log/mongodb/mongod.log` or run `journalctl -u mongod`

### Testing with MongoDB Compass

MongoDB Compass is a graphical tool that can help diagnose connection issues:

1. Download and install [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Try connecting with the same URI used in your application
3. If Compass can connect but your application cannot, the issue might be in your application code

### Network Troubleshooting

If you're connecting to a remote MongoDB instance:

1. Check if the MongoDB host is reachable with `ping`
2. Verify that port 27017 (or your custom port) is open with:
   ```
   # Windows
   Test-NetConnection -ComputerName your-mongodb-host -Port 27017

   # Linux/macOS
   nc -zv your-mongodb-host 27017
   ```

## Need More Help?

If you're still experiencing connection issues after trying these solutions:

1. Check the application logs for detailed error messages
2. Review the MongoDB documentation for your specific deployment
3. For MongoDB Atlas users, check the Atlas status page and support resources
