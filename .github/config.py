#!/usr/bin/env python3

import argparse
import json
import subprocess

def git(cmd):
    return subprocess.run(cmd, text=True, stdout=subprocess.PIPE).stdout.strip().splitlines()

def git_tags():
    cmd = ['git', 'tag', '--list', '--sort=version:refname']

    return git(cmd)

def git_branches():
    cmd = ['git', 'branch', '--list', '--format=%(refname:short)']

    return git(cmd)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--tags', action='store_true')
    parser.add_argument('--branches', action='store_true')
    parser.add_argument('--latest', action='store_true')
    args = parser.parse_args()

    if args.latest:
        print(git_tags()[-1])
        return

    refs = []

    if args.tags:
        refs += git_tags()

    if args.branches:
        refs += git_branches()
        refs = [ ref for ref in refs if '/' not in ref ]

    refs = [ { 'ref': ref, 'name': ref } for ref in refs ]

    matrix = {
        'include': refs,
    }

    print(json.dumps(matrix))

if __name__ == '__main__':
    main()
