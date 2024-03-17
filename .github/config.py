#!/usr/bin/env python3

import argparse
import json
import subprocess

def git_tags():
    cmd = ['git', 'tag', '--list', '--sort=version:refname']

    return subprocess.run(cmd, text=True, stdout=subprocess.PIPE).stdout.strip().splitlines()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--latest', action='store_true')
    args = parser.parse_args()

    tags = git_tags()

    if args.latest:
        print(tags[-1])
        return

    tags = [ { 'ref': tag, 'name': tag } for tag in tags ]
    tags += [ { 'ref': 'main', 'name': 'testing' } ]

    matrix = {
        'include': tags,
    }

    print(json.dumps(matrix))

if __name__ == '__main__':
    main()
