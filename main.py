import threading
import os
import base64
import json
import requests
import IPython
import datetime
import re
import flask

import pymongo

from flask import Flask, render_template, request, jsonify
app = Flask(__name__)

mongoClient = pymongo.MongoClient('localhost', 27017)
db = mongoClient.KC31
macAddressChecker = re.compile("^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$")


@app.route('/openREPL')
def openREPL():
	IPython.embed()

def getNextSerialNumber():
	records = db.heliostatmodules.find({'serialNumber' : {'$exists' : True}}, {'serialNumber': 1, '_id' : 0})
	
	if(records.count() == 0):
		return 0;
	else:
		records.sort('serialNumber', pymongo.DESCENDING);
		return records[0]['serialNumber'] + 1;

@app.route('/nodeStartup/<string:macAddress>')
def informStartup(macAddress):
	# format the mac addres to be A1:B2:C3:D4:E5:F6
	macAddress = macAddress.upper().replace("-", ":")

	# check valid mac address
	if not macAddressChecker.match(macAddress):
		return flask.jsonify({"error": "mac address is invalid"})

	# check if it's in the database already
	results = db.heliostatmodules.find({'macAddress': macAddress})
	isNew = results.count() is 0
	
	document = {}

	if(isNew):
		# add this heliostat module to the database
		document = {
			'macAddress': macAddress,
			'serverTimestamp' : datetime.datetime.now()
		}
		id = db.heliostatmodules.insert(document)
		document['_id'] = id
	else:
		document = results[0];

	#check if it has a serialNumber
	serialNumber = 0

	if 'serialNumber' in document:
		serialNumber = int(document['serialNumber'])
	else:
		serialNumber = getNextSerialNumber();
		db.heliostatmodules.update({ '_id' : document['_id']}, {'$set' : { 'serialNumber' : serialNumber}})

	#record the startup time
	db.heliostatmodules.update({ '_id' : document['_id']}, {'$push' : { 'startups' : datetime.datetime.now()}})

	return flask.jsonify({
		'isNew' : isNew,
		'macAddress' : macAddress,
		'serialNumber' : serialNumber
	});
