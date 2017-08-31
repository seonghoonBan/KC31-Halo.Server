from setuptools import setup

setup (
    name = 'KC31Server',
    packages=['KC31Server'],
    include_package_data = True,
    install_requires = [
        'flask',
        'pymongo'
    ],
)
