#!/usr/bin/env python
#
# Copyright 2007 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
from __future__ import with_statement

from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.ext.webapp import template
from google.appengine.api import urlfetch

import logging
import os

congress_api_key = "a106fcf16562db1b53457bb23d99bb69:2:61430921"
congress_url = "http://api.nytimes.com/svc/politics/v3/us/legislative/congress/"
congress_number = "111"
congress_chamber = "senate"

campaignfinance_api_key = "f7bf1960605302c84659ca8bd0296e8d:17:61430921"

opensecrets_api_key = "5f78f99daf0ac417f6c390e75310c1b0" #kari's: "1cdaa7ae9e0288e071fcf1baa1867b6a"
opensecrets_url = "http://www.opensecrets.org/api/"

crp_candidates = {}

class MainHandler(webapp.RequestHandler):
    def get(self):
		path = os.path.join(os.path.dirname(__file__), '../index.html')
		template_values = {}
		self.response.out.write(template.render(path, template_values))
		
class SenatorsHandler(webapp.RequestHandler):
	def get(self):
		url = congress_url + congress_number + "/" + congress_chamber + "/members.json?api-key=" + congress_api_key
		result = urlfetch.fetch(url)
		self.response.out.write(result.content)
		
class VotesHandler(webapp.RequestHandler):
	def get(self):
		senatorId = self.request.get("id");
		url = congress_url + "members/" + senatorId + "/votes?api-key=" + congress_api_key
		logging.error(url)
		xml = urlfetch.fetch(url).content
		self.response.out.write(xml)
		
class MoneyHandler(webapp.RequestHandler):
	def get(self):
		name = self.request.get("name");
		cid = crp_candidates.get(name)
		url = opensecrets_url + "?method=candIndustry&cid=" + cid + "&output=json&apikey=" + opensecrets_api_key
		result = urlfetch.fetch(url)
		self.response.out.write(result.content)
		
def main():
	with open("cid.txt") as cid:
		for line in cid:
			tokens = line.split(",")
			name =  tokens[2].strip("\n\r") + tokens[1]
			crp_candidates[name] = tokens[0] # assuming candidate full name is unique
	application = webapp.WSGIApplication([('/', MainHandler), ('/senators', SenatorsHandler), ('/votes', VotesHandler), ('/money', MoneyHandler)], debug=True)
	util.run_wsgi_app(application)

if __name__ == '__main__':
	main()