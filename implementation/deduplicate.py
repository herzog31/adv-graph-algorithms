'''
Deduplicate Script for
Advanced Graph Algorithms Project

@author Mark J. Becker
'''

import os
import difflib

# Compare files in following folders
folders = ['library', 'chinese-postman', 'floyd-warshall', 'hierholzer', 'hopcroft-karp', 'hungarian']
# Identity threshold
threshold = 0.5
# Files types to exclude
exclude = []
# Fill exclude with .gitignore file
gitignore = open('../.gitignore').read().splitlines()
f = lambda x: x.replace("*", "")
gitignore = map(f, gitignore)
exclude = exclude + gitignore;

def checkExclude(basename, exclude):
	for suffix in exclude:
		if basename.endswith(suffix):
			return True
	return False

files = {}
similar = []
compared = []
numberOfFiles = 0

# Scan all files
for folder in folders:
	files[folder] = []
	for root, dirnames, filenames in os.walk(folder):
		for filename in filenames:
			if checkExclude(filename, exclude): continue
			numberOfFiles += 1
			files[folder].append({'path': os.path.join(root, filename), 'basename': filename, 'ext': os.path.splitext(filename)[1]})

totalComparisons = numberOfFiles * numberOfFiles - numberOfFiles
print "Number of Files: %d, Total Comparisons: %d" % (numberOfFiles, totalComparisons)

index = 1

# Compare files
for folder in folders:
	print "Current folder "+ folder + ":"
	for item in files[folder]:
		itemContent = open(item['path']).read().splitlines()
		matches = []
		for searchFolder in folders:
			# Only compare files of different graph algorithms
			if searchFolder == folder: continue
			for searchItem in files[searchFolder]:
				index += 1
				# Skip already compared files
				if item['path'] in compared: continue
				# Only compare files with same type
				if item['ext'] != searchItem['ext']: continue
				# Only compare files with same filename
				# if item['basename'] != searchItem['basename']: continue
				searchItemContent = open(searchItem['path']).read().splitlines()
				result = difflib.unified_diff(itemContent, searchItemContent, n=0)
				ratio = 1.0 - (float(len(list(result))) / float(len(itemContent)))
				print "(%i/%i - %.2f%%) Compare " % (index, totalComparisons, (float(index) / float(totalComparisons)) * 100) + "("+folder+")" + item['basename'] + " with ("+searchFolder+")" + searchItem['basename'] + " -> %.2f%%" % (ratio*100.0)
				if ratio >= threshold:
					matches.append({'basename': searchItem['basename'], 'path': searchItem['path'], 'ratio': ratio})
					compared.append(searchItem['path'])
		if len(matches) > 0:
			similar.append({'basename': item['basename'], 'path': item['path'], 'matchings': matches})
			compared.append(item['path'])
		
# Print results
for item in similar:
	print "\n-----------------------------------------\n" + item['path']
	for matching in item['matchings']:
		print "-> %.2f%% identical to %s" % (matching['ratio']*100.0, matching['path'])
	print "-----------------------------------------"