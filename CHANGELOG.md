# Change Log
All notable changes to the "jira-issues" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] 2018-11-27
- Initial release

## [1.0.1 - 1.0.3] 2018-12-1
### Fixed
- bug where extension doesn't load at all
- load extension even if configuration is missing with helpful message
### Changed
- added more robust error messages throughout

## [1.1.0] 2019-04-21
### Added
- port number added to configuration

## [1.2.0] 2019-06-14
### Fixed
- clicking on Jira Issue now opens issue in a web browser
### Changed
- updated issue format to be identifier, status, description "Project-ID: (status) descriptions"
### Added
- if issue status is "Done", update icon to task_complete icon with green check box