from KC31Server import app

import threading
import os
import os.path
import base64
import json
import requests
import IPython
import datetime
import re

import flask
from flask.ext.autoindex import AutoIndex

import bson.json_util
from bson.objectid import ObjectId
import pymongo
import csv

import pysolar

from flask import Flask, render_template, request, jsonify, send_from_directory

AutoIndex(app, browse_root=os.path.curdir)

mongoClient = pymongo.MongoClient('localhost', 27017)
db = mongoClient.KC31
macAddressChecker = re.compile("^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$")

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        return json.JSONEncoder.default(self, o)


@app.route('/html/<path:path>')
def serveStaticPage(path):
	return send_from_directory('html', path)


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

	return bson.json_util.dumps({
		'isNew' : isNew,
		'document' : document
	});


@app.route('/addHeliostatPositions', methods=['POST'])
def addHeliostatPositions():
	csvString = request.form['csvData']
	csvReader = csv.reader(csvString.split("\n"))
	countAdded = 0
	countRemoved = 0

	#handle truncate
	if('action' in request.form):
		if(request.form['action'] == 'truncate'):
			countRemoved = db.heliostatpositions.remove({})['n']

	for row in csvReader:
		if(len(row) == 6):
			document = {
				"position" : [
					float(row[0]), float(row[1]), float(row[2])
				],
				"transmissionVector" : [
					float(row[3]), float(row[4]), float(row[5])
				],
				"csvIndex" : countAdded
			}
			index = db.heliostatpositions.insert(document);
			countAdded += 1
	
	return jsonify({
		"rowsAdded" : countAdded,
		"rowsRemoved" : countRemoved
	});

@app.route('/getHeliostatPositions')
def getHeliostatPositions():
	return bson.json_util.dumps(db.heliostatpositions.find({}))

@app.route('/getHeliostatPosition/<string:id>')
def getHeliostatPosition(id):
	return bson.json_util.dumps(db.heliostatpositions.find({"_id" : ObjectId(id)}))

@app.route('/updateHeliostatPosition', methods=['POST'])
def updateHeliostatPosition():
	IPython.embed();
	jsonRequest = request.json
	id = request.json['_id']['$oid']
	jsonRequest.pop('_id', None)
	db.heliostatpositions.update({'_id' : ObjectId(id)}
		, {'$set' : jsonRequest})
	return jsonify({'success' : 'true'})

@app.route('/getSiteSettings')
def getSiteSettings():
	return bson.json_util.dumps(db.settings.find_one());

@app.route('/getSolarTracking')
def getSolarTracking():
	siteSettings = json.loads(getSiteSettings())
	now = datetime.datetime.now()
	
	latitude = siteSettings['location']['latitude'];
	longitude = siteSettings['location']['longitude'];

	solarTracking = {
		"sun" : {
			"altitude" : pysolar.solar.get_altitude(latitude, longitude, now),
			"azimuth" : pysolar.solar.get_azimuth(latitude, longitude, now)
		},
		"siteSettings" : siteSettings
	}
	return jsonify(solarTracking)
	