# ************************************************************
# Sequel Pro SQL dump
# Versión 4096
#
# http://www.sequelpro.com/
# http://code.google.com/p/sequel-pro/
#
# Host: 139.59.131.136 (MySQL 5.7.20-0ubuntu0.16.04.1)
# Base de datos: imaths
# Tiempo de Generación: 2018-01-20 08:26:06 +0000
# ************************************************************


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


# Volcado de tabla activities
# ------------------------------------------------------------

DROP TABLE IF EXISTS `activities`;

CREATE TABLE `activities` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `levels` longtext,
  `idSubject` int(11) NOT NULL DEFAULT '1',
  `activity` longtext,
  `activityType` varchar(11) NOT NULL DEFAULT '0',
  `share` tinyint(4) NOT NULL DEFAULT '2',
  `createdBy` varchar(255) NOT NULL DEFAULT 'admin',
  `createdWhen` datetime NOT NULL,
  `description` longtext,
  `category` longtext,
  `difficulty` int(11) DEFAULT NULL,
  `icon` varchar(255) DEFAULT NULL,
  `ytid` varchar(255) DEFAULT NULL,
  `ytqu` tinyint(4) DEFAULT '0',
  `ggbid` varchar(255) DEFAULT NULL,
  `hasAct` tinyint(4) DEFAULT '0',
  `createjs` tinyint(4) DEFAULT '0',
  `counter` int(11) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Volcado de tabla answers
# ------------------------------------------------------------

DROP TABLE IF EXISTS `answers`;

CREATE TABLE `answers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `idQuestion` int(11) NOT NULL DEFAULT '0',
  `answer` longtext,
  `isCorrect` enum('N','S','') NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Volcado de tabla assignments
# ------------------------------------------------------------

DROP TABLE IF EXISTS `assignments`;

CREATE TABLE `assignments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `idActivity` int(10) unsigned DEFAULT '0',
  `idUser` int(11) DEFAULT NULL COMMENT 'who creates the assignment',
  `idUnit` int(11) DEFAULT NULL,
  `postDate` timestamp NULL DEFAULT NULL,
  `order` int(11) NOT NULL DEFAULT '0',
  `fromDate` timestamp NULL DEFAULT NULL COMMENT 'no start date if null',
  `toDate` timestamp NULL DEFAULT NULL COMMENT 'no end date if null',
  `maxAttempts` int(11) DEFAULT '0' COMMENT '0=undefined',
  `instructions` longtext,
  `applyToAll` tinyint(4) NOT NULL DEFAULT '0',
  `params` longtext,
  `visible` tinyint(4) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Volcado de tabla assignments_users
# ------------------------------------------------------------

DROP TABLE IF EXISTS `assignments_users`;

CREATE TABLE `assignments_users` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `idAssignment` int(11) DEFAULT NULL,
  `idUser` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Volcado de tabla attempts
# ------------------------------------------------------------

DROP TABLE IF EXISTS `attempts`;

CREATE TABLE `attempts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `idLogins` int(11) NOT NULL DEFAULT '0',
  `idActivity` int(11) DEFAULT NULL,
  `idAssignment` int(11) NOT NULL DEFAULT '0',
  `idGroup` int(11) DEFAULT NULL,
  `idKahoot` int(11) NOT NULL DEFAULT '0',
  `attemptStart` datetime DEFAULT NULL,
  `attemptEnd` datetime DEFAULT NULL,
  `done` enum('N','S') NOT NULL DEFAULT 'N',
  `score` int(11) NOT NULL DEFAULT '0',
  `level` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Volcado de tabla badges
# ------------------------------------------------------------

DROP TABLE IF EXISTS `badges`;

CREATE TABLE `badges` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `idUser` int(11) NOT NULL DEFAULT '0',
  `type` int(4) DEFAULT NULL,
  `day` date NOT NULL,
  `rscore` int(11) NOT NULL DEFAULT '0',
  `idCreator` int(11) NOT NULL DEFAULT '0',
  `idGroup` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Volcado de tabla books
# ------------------------------------------------------------

DROP TABLE IF EXISTS `books`;

CREATE TABLE `books` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `bookCode` longtext,
  `title` longtext,
  `author` varchar(255) DEFAULT NULL,
  `url` longtext,
  `year` int(11) DEFAULT NULL,
  `level` varchar(25) DEFAULT NULL,
  `genre` varchar(25) DEFAULT NULL,
  `img` longtext,
  `key` tinyint(1) DEFAULT NULL,
  `allStudents` tinyint(11) DEFAULT NULL,
  `allTeachers` tinyint(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Volcado de tabla books_user
# ------------------------------------------------------------

DROP TABLE IF EXISTS `books_user`;

CREATE TABLE `books_user` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `idbook` int(11) DEFAULT NULL,
  `idUser` int(11) DEFAULT NULL,
  `idGroup` int(11) DEFAULT NULL,
  `expires` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Volcado de tabla categories
# ------------------------------------------------------------

DROP TABLE IF EXISTS `categories`;

CREATE TABLE `categories` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `idSubject` int(11) DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Volcado de tabla challenges
# ------------------------------------------------------------

DROP TABLE IF EXISTS `challenges`;

CREATE TABLE `challenges` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `w` int(11) DEFAULT NULL,
  `level` int(11) DEFAULT NULL,
  `formulation` longtext,
  `score` int(11) NOT NULL DEFAULT '150',
  `ranswer` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Volcado de tabla challenges_quizz
# ------------------------------------------------------------

DROP TABLE IF EXISTS `challenges_quizz`;

CREATE TABLE `challenges_quizz` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `idChallenge` int(11) DEFAULT NULL,
  `idUser` int(11) DEFAULT NULL,
  `when` datetime DEFAULT NULL,
  `answer` longtext,
  `valid` int(4) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Volcado de tabla chats
# ------------------------------------------------------------

DROP TABLE IF EXISTS `chats`;

CREATE TABLE `chats` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `idGroup` int(11) DEFAULT NULL,
  `idUser` int(11) DEFAULT NULL,
  `when` timestamp NULL DEFAULT NULL,
  `msg` longtext,
  `isFor` int(11) NOT NULL DEFAULT '0',
  `parents` tinyint(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Volcado de tabla comments
# ------------------------------------------------------------

DROP TABLE IF EXISTS `comments`;

CREATE TABLE `comments` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `idUser` int(11) DEFAULT NULL,
  `idActivity` int(11) DEFAULT NULL,
  `when` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `comment` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Volcado de tabla enroll
# ------------------------------------------------------------

DROP TABLE IF EXISTS `enroll`;

CREATE TABLE `enroll` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `idGroup` int(11) DEFAULT NULL,
  `idUser` int(11) DEFAULT NULL,
  `idRole` int(11) NOT NULL DEFAULT '200',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Volcado de tabla forums
# ------------------------------------------------------------

DROP TABLE IF EXISTS `forums`;

CREATE TABLE `forums` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `forum` varchar(255) NOT NULL DEFAULT '',
  `description` longtext,
  `createdBy` int(11) NOT NULL,
  `createdWhen` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `idGroup` int(11) NOT NULL DEFAULT '0',
  `canCreateThemes` varchar(255) NOT NULL DEFAULT '',
  `visited` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Volcado de tabla forums_themes
# ------------------------------------------------------------

DROP TABLE IF EXISTS `forums_themes`;

CREATE TABLE `forums_themes` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `idForum` int(11) NOT NULL,
  `theme` varchar(255) NOT NULL DEFAULT '',
  `description` longtext,
  `createdBy` int(11) NOT NULL,
  `createdWhen` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `canCreateEntries` varchar(255) NOT NULL DEFAULT '',
  `visited` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Volcado de tabla forums_themes_entries
# ------------------------------------------------------------

DROP TABLE IF EXISTS `forums_themes_entries`;

CREATE TABLE `forums_themes_entries` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `idForumTheme` int(11) NOT NULL,
  `entry` longtext NOT NULL,
  `createdBy` int(11) NOT NULL,
  `createdWhen` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `answerTo` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Volcado de tabla groups
# ------------------------------------------------------------

DROP TABLE IF EXISTS `groups`;

CREATE TABLE `groups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `groupName` varchar(255) NOT NULL,
  `groupLevel` int(11) NOT NULL DEFAULT '1',
  `groupStudies` varchar(5) NOT NULL DEFAULT 'BAT',
  `groupLetter` varchar(255) NOT NULL DEFAULT 'A',
  `groupYear` int(11) DEFAULT NULL,
  `idUserCreator` int(11) NOT NULL DEFAULT '0',
  `enrollPassword` varchar(255) NOT NULL,
  `idSubject` int(11) NOT NULL DEFAULT '1',
  `currentUnit` int(11) NOT NULL DEFAULT '0',
  `gopts` longtext,
  `thmcss` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Volcado de tabla kahoot
# ------------------------------------------------------------

DROP TABLE IF EXISTS `kahoot`;

CREATE TABLE `kahoot` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `idActivity` int(11) DEFAULT NULL,
  `idAssignment` int(11) DEFAULT NULL,
  `idTeacher` int(11) DEFAULT NULL,
  `idGroup` int(11) DEFAULT NULL,
  `start` timestamp NULL DEFAULT NULL,
  `end` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Volcado de tabla logins
# ------------------------------------------------------------

DROP TABLE IF EXISTS `logins`;

CREATE TABLE `logins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `idUser` int(11) DEFAULT NULL,
  `parents` tinyint(1) NOT NULL DEFAULT '0',
  `ip` varchar(255) DEFAULT NULL,
  `login` timestamp NULL DEFAULT NULL,
  `logout` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Volcado de tabla news
# ------------------------------------------------------------

DROP TABLE IF EXISTS `news`;

CREATE TABLE `news` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `html` longtext,
  `title` longtext,
  `expires` datetime DEFAULT NULL,
  `order` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Volcado de tabla pda_activities
# ------------------------------------------------------------

DROP TABLE IF EXISTS `pda_activities`;

CREATE TABLE `pda_activities` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `trimestre` tinyint(11) DEFAULT NULL,
  `desc` longtext,
  `dia` date DEFAULT NULL,
  `idCreator` int(11) DEFAULT NULL,
  `idGroup` int(11) DEFAULT NULL,
  `weight` float DEFAULT NULL,
  `category` longtext,
  `visible` tinyint(4) DEFAULT '1',
  `formula` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Volcado de tabla pda_activities_grades
# ------------------------------------------------------------

DROP TABLE IF EXISTS `pda_activities_grades`;

CREATE TABLE `pda_activities_grades` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `idActivity` int(11) DEFAULT NULL,
  `idUser` int(11) DEFAULT NULL,
  `grade` float DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Volcado de tabla questions
# ------------------------------------------------------------

DROP TABLE IF EXISTS `questions`;

CREATE TABLE `questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `idAttempt` int(11) DEFAULT '0',
  `question` longtext,
  `rightAnswer` longtext,
  `seconds` int(11) NOT NULL DEFAULT '0',
  `score` int(11) DEFAULT NULL,
  `category` varchar(255) DEFAULT 'g',
  `level` tinyint(4) DEFAULT '0',
  `askTheory` varchar(4) DEFAULT NULL,
  `askHelp` varchar(4) DEFAULT NULL,
  `askAnswer` varchar(4) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Volcado de tabla ratings
# ------------------------------------------------------------

DROP TABLE IF EXISTS `ratings`;

CREATE TABLE `ratings` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `idActivity` int(11) NOT NULL,
  `idUser` int(11) NOT NULL,
  `rate` int(11) unsigned DEFAULT NULL,
  `vrate` int(11) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Volcado de tabla regularity
# ------------------------------------------------------------

DROP TABLE IF EXISTS `regularity`;

CREATE TABLE `regularity` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `idUser` int(11) NOT NULL DEFAULT '0',
  `week` int(11) NOT NULL DEFAULT '0',
  `rscore` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Volcado de tabla schools
# ------------------------------------------------------------

DROP TABLE IF EXISTS `schools`;

CREATE TABLE `schools` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `schoolName` varchar(255) NOT NULL,
  `professorName` varchar(255) DEFAULT NULL,
  `professorEmail` varchar(255) DEFAULT NULL,
  `language` varchar(5) DEFAULT 'ca',
  `enrollPassword` varchar(255) DEFAULT NULL,
  `canEnroll` tinyint(4) NOT NULL DEFAULT '0',
  `canPublish` int(4) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Volcado de tabla steps
# ------------------------------------------------------------

DROP TABLE IF EXISTS `steps`;

CREATE TABLE `steps` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `idQuestion` int(11) DEFAULT NULL,
  `step` longtext,
  `askHelp` enum('N','S') NOT NULL DEFAULT 'N',
  `askSolution` enum('N','S') NOT NULL DEFAULT 'N',
  `askTheory` enum('N','S') NOT NULL DEFAULT 'N',
  `seconds` int(11) NOT NULL DEFAULT '0',
  `rightAnswer` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Volcado de tabla subjects
# ------------------------------------------------------------

DROP TABLE IF EXISTS `subjects`;

CREATE TABLE `subjects` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(11) NOT NULL DEFAULT '',
  `longname` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

LOCK TABLES `subjects` WRITE;
/*!40000 ALTER TABLE `subjects` DISABLE KEYS */;

INSERT INTO `subjects` (`id`, `name`, `longname`)
VALUES
	(1,'MAT','Matemàtiques'),
	(2,'CAT','Català'),
	(3,'CAST','Castellà'),
	(4,'ANG','Anglès'),
	(5,'FQ','Física i química'),
	(6,'PLA','Plástica'),
	(7,'VE','Valors ètics'),
	(8,'REL','Religió'),
	(9,'EF','Educació física'),
	(10,'TEC','Tecnologia'),
	(11,'DIB','Bibuix tècnic'),
	(12,'SAL','Alemany'),
	(13,'BIO','Biologia'),
	(14,'FILO','Filosofia'),
	(15,'FIS','Física'),
	(16,'QUIM','Química'),
	(17,'CC','Cultura científica');

/*!40000 ALTER TABLE `subjects` ENABLE KEYS */;
UNLOCK TABLES;


# Volcado de tabla translate
# ------------------------------------------------------------

DROP TABLE IF EXISTS `translate`;

CREATE TABLE `translate` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `idActivity` int(11) DEFAULT NULL,
  `lang` varchar(11) DEFAULT '',
  `translator` varchar(255) NOT NULL DEFAULT 'admin',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Volcado de tabla units
# ------------------------------------------------------------

DROP TABLE IF EXISTS `units`;

CREATE TABLE `units` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `idGroup` int(11) NOT NULL DEFAULT '0',
  `unit` longtext NOT NULL,
  `order` int(11) unsigned NOT NULL DEFAULT '0',
  `visible` tinyint(4) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Volcado de tabla uploads
# ------------------------------------------------------------

DROP TABLE IF EXISTS `uploads`;

CREATE TABLE `uploads` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `idAssignment` int(11) NOT NULL DEFAULT '0',
  `idUser` int(11) NOT NULL DEFAULT '0',
  `file` longtext NOT NULL,
  `message` longtext,
  `uploadDate` datetime DEFAULT NULL,
  `score` int(11) NOT NULL DEFAULT '-1',
  `feedback` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Volcado de tabla users
# ------------------------------------------------------------

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `idRole` int(11) NOT NULL DEFAULT '0',
  `username` varchar(255) NOT NULL,
  `fullname` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL DEFAULT '111111',
  `passwordParents` varchar(255) DEFAULT NULL,
  `emailParents` varchar(255) DEFAULT NULL,
  `mustChgPwd` int(4) NOT NULL DEFAULT '0',
  `email` varchar(255) NOT NULL DEFAULT '',
  `emailPassword` varchar(255) DEFAULT NULL,
  `phone` varchar(255) NOT NULL DEFAULT '',
  `schoolId` int(11) DEFAULT '0',
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `valid` tinyint(4) NOT NULL DEFAULT '1',
  `uopts` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Volcado de tabla visualization
# ------------------------------------------------------------

DROP TABLE IF EXISTS `visualization`;

CREATE TABLE `visualization` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `idActivity` int(11) DEFAULT NULL,
  `idAssignment` int(11) NOT NULL DEFAULT '0',
  `resource` varchar(255) DEFAULT NULL,
  `vscore` int(11) DEFAULT NULL,
  `vseconds` int(11) DEFAULT NULL,
  `idLogins` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



# Volcado de tabla visualization_quizz
# ------------------------------------------------------------

DROP TABLE IF EXISTS `visualization_quizz`;

CREATE TABLE `visualization_quizz` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `idV` int(11) DEFAULT NULL,
  `formulation` longtext,
  `answer` longtext,
  `rightAnswer` longtext,
  `isValid` tinyint(11) DEFAULT NULL,
  `penalty` int(11) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;




/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
