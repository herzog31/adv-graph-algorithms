'''
Deduplicate Script for
Advanced Graph Algorithms Project

@author Mark J. Becker
'''

import os



print "Test"

folders = ['chinese-postman', 'floyd-warshall', 'hierholzer', 'hopcroft-karp', 'hungarian']

for folder in folders:
	for root, dirnames, filenames in os.walk(folder):
		for filename in filenames:
			print os.path.join(root, filename)