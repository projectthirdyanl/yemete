#!/usr/bin/env node
/**
 * Simple Redis connection test script
 * Tests if Redis is accessible from the worker VM
 * Run with: node proxmox/test-redis-connection.js
 */

const net = require('net');

const REDIS_HOST = process.env.REDIS_HOST || '192.168.120.44';
const REDIS_PORT = process.env.REDIS_PORT || 6379;

console.log(`Testing Redis connection to ${REDIS_HOST}:${REDIS_PORT}...`);

// Test 1: Basic TCP connection
const socket = new net.Socket();
const timeout = 5000;

socket.setTimeout(timeout);

socket.on('connect', () => {
  console.log('✓ TCP connection successful');
  console.log('✓ Redis port is open and accepting connections');
  
  // Send PING command
  socket.write('*1\r\n$4\r\nPING\r\n');
  
  socket.on('data', (data) => {
    const response = data.toString();
    if (response.includes('PONG') || response.includes('+PONG')) {
      console.log('✓ Redis responded to PING command');
      console.log('✓ Redis is fully accessible!');
    } else {
      console.log('⚠ Redis responded but not with expected PONG:', response);
    }
    socket.destroy();
    process.exit(0);
  });
});

socket.on('timeout', () => {
  console.error('✗ Connection timeout');
  socket.destroy();
  process.exit(1);
});

socket.on('error', (error) => {
  if (error.code === 'ECONNREFUSED') {
    console.error('✗ Connection refused - Redis is not accepting connections on this interface');
    console.error('  This means Redis is either:');
    console.error('  1. Not running');
    console.error('  2. Not bound to 192.168.120.44 (only bound to localhost)');
    console.error('  3. Blocked by firewall');
  } else if (error.code === 'EHOSTUNREACH' || error.code === 'ENETUNREACH') {
    console.error('✗ Network unreachable - Cannot reach Redis server');
    console.error('  Check network connectivity: ping 192.168.120.44');
  } else {
    console.error('✗ Connection error:', error.message);
  }
  process.exit(1);
});

socket.connect(REDIS_PORT, REDIS_HOST);
