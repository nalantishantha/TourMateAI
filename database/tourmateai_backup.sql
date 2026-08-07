-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: tourmateai
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `adminactions`
--

DROP TABLE IF EXISTS `adminactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `adminactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_id` int DEFAULT NULL,
  `action_type` varchar(50) NOT NULL,
  `notes` text,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_AdminActions_admin_id` (`admin_id`),
  KEY `ix_AdminActions_action_type` (`action_type`),
  CONSTRAINT `adminactions_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `adminactions`
--

LOCK TABLES `adminactions` WRITE;
/*!40000 ALTER TABLE `adminactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `adminactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `alembic_version`
--

DROP TABLE IF EXISTS `alembic_version`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alembic_version` (
  `version_num` varchar(32) NOT NULL,
  PRIMARY KEY (`version_num`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alembic_version`
--

LOCK TABLES `alembic_version` WRITE;
/*!40000 ALTER TABLE `alembic_version` DISABLE KEYS */;
INSERT INTO `alembic_version` VALUES ('a7b3e9d24c10');
/*!40000 ALTER TABLE `alembic_version` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attractions`
--

DROP TABLE IF EXISTS `attractions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attractions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `description` text,
  `category` varchar(80) DEFAULT NULL,
  `latitude` float DEFAULT NULL,
  `longitude` float DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `avg_rating` float DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_Attractions_category` (`category`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attractions`
--

LOCK TABLES `attractions` WRITE;
/*!40000 ALTER TABLE `attractions` DISABLE KEYS */;
INSERT INTO `attractions` VALUES (1,'Sigiriya Rock Fortress','5th-century rock fortress and palace ruins with frescoes and water gardens, a UNESCO World Heritage Site.','Heritage',7.957,80.7603,'http://localhost:5000/api/admin/attractions/uploads/7fa6453d9e03427b9e1602d7b78ed3b2.jpeg',1,'2026-07-04 14:46:11'),(2,'Temple of the Sacred Tooth Relic','Kandy\'s revered Buddhist temple housing a relic of the tooth of the Buddha.','Religious',7.2936,80.6413,NULL,0,'2026-07-04 14:46:11'),(3,'Galle Fort','A fortified old town built by the Portuguese and Dutch, ringed by ramparts on the southern coast.','Heritage',6.0257,80.217,NULL,0,'2026-07-04 14:46:11'),(4,'Nine Arch Bridge, Ella','An iconic colonial-era railway viaduct set amid tea plantations and jungle.','Scenic',6.8767,81.0603,NULL,0,'2026-07-04 14:46:11'),(5,'Yala National Park','Sri Lanka\'s most visited national park, famous for its high density of leopards and elephants.','Wildlife',6.3735,81.5165,NULL,0,'2026-07-04 14:46:11'),(6,'Adam\'s Peak (Sri Pada)','A sacred conical mountain with a pilgrimage trail to the footprint shrine at its summit.','Hiking',6.8096,80.4994,NULL,4,'2026-07-04 14:46:11'),(7,'Dambulla Cave Temple','A vast cave monastery of five sanctuaries filled with Buddha statues and murals.','Heritage',7.8567,80.649,NULL,0,'2026-07-04 14:46:11'),(8,'Nuwara Eliya','A cool highland town nicknamed \'Little England\', surrounded by tea estates and waterfalls.','Hill Country',6.9497,80.7891,NULL,0,'2026-07-04 14:46:11'),(9,'Mirissa Beach','A palm-fringed southern beach known for surfing and blue-whale watching.','Beach',5.9483,80.4589,NULL,0,'2026-07-04 14:46:11'),(10,'Anuradhapura','An ancient sacred city with dagobas, monasteries and the Sri Maha Bodhi tree.','Heritage',8.3114,80.4037,'http://localhost:5000/api/admin/attractions/uploads/031eaa274d84475aa1d0192b3acaad53.jpeg',0,'2026-07-04 14:46:11'),(11,'Polonnaruwa','A medieval capital of well-preserved ruins, statues and the Gal Vihara rock carvings.','Heritage',7.9403,81.0188,NULL,0,'2026-07-04 14:46:11'),(12,'Horton Plains National Park','A misty highland plateau with cloud forest, grasslands and the World\'s End escarpment.','Heritage',6.8022,80.806,NULL,0,'2026-07-04 14:46:11'),(13,'Trincomalee','An east-coast port city with natural harbours, Nilaveli beach and Koneswaram temple.','Beach',8.5874,81.2152,NULL,0,'2026-07-04 14:46:11'),(14,'Unawatuna Beach','A sheltered crescent bay near Galle, popular for swimming and snorkelling.','Beach',6.0097,80.2497,NULL,3,'2026-07-04 14:46:11'),(15,'Pinnawala Elephant Orphanage','A sanctuary caring for orphaned and injured elephants, known for its river bathing.','Wildlife',7.3006,80.3849,NULL,0,'2026-07-04 14:46:11'),(17,'Hikkaduwa Beach','A south-coast beach town famed for its coral reef, sea turtles and surf breaks.','Beach',6.1395,80.1063,NULL,0,'2026-07-08 02:58:36'),(18,'Blue Beach Island, Nilwella','A quiet lagoon-side stretch near Nilwella with a small island just offshore, popular for swimming and snorkelling.','Beach',5.97,80.69,NULL,0,'2026-07-08 02:58:36'),(19,'Knuckles Mountain Range','A UNESCO-listed massif of cloud forest and jagged peaks named for its knuckle-like ridgeline, laced with trekking trails.','Heritage',7.4667,80.7833,NULL,0,'2026-07-08 02:58:36'),(20,'Ella Rock','A hill-country summit above Ella reached by a scenic trail through tea estates, with panoramic valley views at the top.','Hiking',6.8613,81.0464,NULL,0,'2026-07-08 02:58:36'),(21,'Haritha Kanda (Green Mountain), Bopaththalawa','A lush highland peak near Bopaththalawa in tea country, known for a steep climb and sweeping views over the plantations.','Hiking',7.0333,80.6667,NULL,0,'2026-07-08 02:58:36'),(22,'Wilpaththu National Park','Sri Lanka\'s largest national park, a wilderness of dense scrub and \'willus\' (natural lakes) known for leopards and sloth bears.','Wildlife',8.463,80.0308,NULL,0,'2026-07-08 02:58:36'),(23,'Dehiwala Zoological Garden','Sri Lanka\'s largest zoological garden, home to a wide variety of mammals, birds, reptiles, and aquatic life, offering educational and family-friendly wildlife experiences.','Wildlife',6.856,79.8737,'http://localhost:5000/api/admin/attractions/uploads/600fcf1efeb54f8599d8700875f5f533.jpeg',0,'2026-07-11 20:49:33'),(24,'peradeniya botanical garden','Sri Lanka\'s largest botanical garden, home to over 4,000 plant species, including orchids, medicinal plants, towering palm trees, and beautifully landscaped gardens near Kandy.','Nature',7.2719,80.5956,'http://localhost:5000/api/admin/attractions/uploads/e6152718e57848578e4a78eb375a25fe.jpeg',0,'2026-07-11 21:07:12'),(25,'Pathirakali Amman Temple','Pathirakali Amman Temple is a Hindu temple of the goddess Kali who is believed to be an incarnation of goddess Kali Amman located in Trincomalee which is in the eastern province of Sri Lanka. The temple is built in the classical Dravidian style of architecture which is similar to the temple styles found in South India. The temple has a beautiful design and interior along with beautiful sculptures which are nothing short of excellence. Along with temple design, there is also an appropriate description and plenty of stories which have been visualized in the statues','Religious',8.5745,81.2339,'http://localhost:5000/api/admin/attractions/uploads/541c7fe618ca4f569700b23aaf4a5c45.jpeg',0,'2026-07-12 06:53:49'),(26,'Arugam Bay','Arugam Bay is one of the world\'s top surfing destinations, offering pristine sandy beaches, warm Indian Ocean waters, breathtaking sunrises, vibrant cafés, and easy access to nearby wildlife and nature attractions','Beach',6.8469,81.8307,'http://localhost:5000/api/admin/attractions/uploads/0f62635e2beb4ab3adc91e0361576d5e.jpeg',0,'2026-07-12 06:57:33');
/*!40000 ALTER TABLE `attractions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chatlogs`
--

DROP TABLE IF EXISTS `chatlogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chatlogs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `message` text NOT NULL,
  `response` text,
  `created_at` datetime DEFAULT NULL,
  `suggested_attractions` json DEFAULT NULL,
  `quality_flag` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_ChatLogs_user_id` (`user_id`),
  KEY `ix_ChatLogs_quality_flag` (`quality_flag`),
  CONSTRAINT `chatlogs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chatlogs`
--

LOCK TABLES `chatlogs` WRITE;
/*!40000 ALTER TABLE `chatlogs` DISABLE KEYS */;
INSERT INTO `chatlogs` VALUES (3,3,'What are the best beaches?','Sri Lanka has gorgeous beaches! The south coast — Mirissa and Unawatuna near Galle — is great for swimming and whale watching, while Trincomalee on the east coast has calm bays. Here are a few to start with.','2026-07-06 05:29:31','[9, 13, 14]',NULL),(4,6,'hello','I\'m your TourMate assistant for exploring Sri Lanka! Ask me about beaches, wildlife safaris, ancient heritage sites, hiking trails, temples, the hill country, or the best time to visit — and I\'ll point you to some great spots.','2026-07-08 04:48:02','[6, 14, 10]',NULL),(5,9,'hi','I\'m your TourMate assistant for exploring Sri Lanka! Ask me about beaches, wildlife safaris, ancient heritage sites, hiking trails, temples, the hill country, or the best time to visit — and I\'ll point you to some great spots.','2026-07-13 04:39:37','[6, 14, 1]',NULL);
/*!40000 ALTER TABLE `chatlogs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feedback`
--

DROP TABLE IF EXISTS `feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedback` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `attraction_id` int NOT NULL,
  `rating` int NOT NULL,
  `comment` text,
  `created_at` datetime DEFAULT NULL,
  `is_hidden` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `ix_Feedback_attraction_id` (`attraction_id`),
  KEY `ix_Feedback_user_id` (`user_id`),
  CONSTRAINT `feedback_ibfk_1` FOREIGN KEY (`attraction_id`) REFERENCES `attractions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `feedback_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedback`
--

LOCK TABLES `feedback` WRITE;
/*!40000 ALTER TABLE `feedback` DISABLE KEYS */;
INSERT INTO `feedback` VALUES (2,3,14,3,NULL,'2026-07-06 13:13:58',0),(3,6,1,1,NULL,'2026-07-12 07:00:03',0);
/*!40000 ALTER TABLE `feedback` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `interactions`
--

DROP TABLE IF EXISTS `interactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `interactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `attraction_id` int NOT NULL,
  `interaction_type` enum('view','like','visit') NOT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_Interactions_attraction_id` (`attraction_id`),
  KEY `ix_Interactions_user_id` (`user_id`),
  KEY `ix_interactions_user_attraction` (`user_id`,`attraction_id`),
  CONSTRAINT `interactions_ibfk_1` FOREIGN KEY (`attraction_id`) REFERENCES `attractions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `interactions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `interactions`
--

LOCK TABLES `interactions` WRITE;
/*!40000 ALTER TABLE `interactions` DISABLE KEYS */;
INSERT INTO `interactions` VALUES (3,3,5,'view','2026-07-06 06:33:27'),(4,3,14,'view','2026-07-06 13:13:53'),(5,3,5,'like','2026-07-06 14:13:39'),(6,6,1,'view','2026-07-07 12:38:59'),(7,6,7,'view','2026-07-08 01:47:19'),(8,6,6,'view','2026-07-08 01:47:34'),(9,6,21,'view','2026-07-08 03:01:36'),(10,6,6,'view','2026-07-08 04:10:53'),(11,6,2,'view','2026-07-08 04:28:20'),(12,6,2,'view','2026-07-08 04:28:32'),(13,6,6,'view','2026-07-08 04:48:05'),(14,6,6,'view','2026-07-08 04:48:14'),(15,6,6,'view','2026-07-08 12:21:48'),(16,6,14,'view','2026-07-08 12:22:34'),(17,6,14,'view','2026-07-08 14:01:20'),(18,6,14,'view','2026-07-08 14:01:37'),(19,6,6,'view','2026-07-11 12:41:49'),(20,6,6,'view','2026-07-11 18:43:53'),(21,6,14,'view','2026-07-11 18:44:08'),(22,9,20,'view','2026-07-11 20:41:37'),(23,6,20,'view','2026-07-11 20:42:32'),(24,6,23,'view','2026-07-11 20:55:45'),(25,6,1,'view','2026-07-11 21:16:33'),(26,6,26,'view','2026-07-12 06:57:43'),(27,6,26,'view','2026-07-12 06:59:31'),(28,6,1,'view','2026-07-12 06:59:59'),(29,6,1,'view','2026-07-12 07:00:17'),(30,6,1,'view','2026-07-12 07:00:36'),(31,9,1,'view','2026-07-12 07:56:59'),(32,9,26,'view','2026-07-12 08:07:32'),(33,9,6,'view','2026-07-13 04:34:27'),(34,9,14,'view','2026-07-13 04:35:43'),(36,6,21,'view','2026-07-13 04:49:56'),(37,6,14,'view','2026-07-13 05:08:39'),(39,6,11,'view','2026-07-14 02:51:16'),(40,9,6,'view','2026-07-21 14:51:34'),(41,6,6,'view','2026-07-21 14:54:55');
/*!40000 ALTER TABLE `interactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `itineraries`
--

DROP TABLE IF EXISTS `itineraries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `itineraries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(200) NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_Itineraries_user_id` (`user_id`),
  CONSTRAINT `itineraries_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `itineraries`
--

LOCK TABLES `itineraries` WRITE;
/*!40000 ALTER TABLE `itineraries` DISABLE KEYS */;
INSERT INTO `itineraries` VALUES (3,3,'wild looking','2026-07-06','2026-07-08','2026-07-06 06:48:02'),(4,3,'beach side ride','2026-07-07','2026-07-08','2026-07-06 13:07:39'),(5,3,'my journey','2026-07-08','2026-07-08','2026-07-06 13:50:31'),(9,6,'hilling','2026-07-08','2026-07-09','2026-07-08 03:16:57'),(10,6,'My journey','2026-07-08','2026-07-10','2026-07-08 04:46:00'),(11,6,'wild looking','2026-07-09','2026-07-10','2026-07-08 12:23:06'),(12,9,'My journey','2026-07-11','2026-07-13','2026-07-11 18:47:07'),(13,9,'my trip','2026-07-14','2026-07-15','2026-07-12 07:58:52'),(14,9,'wild looking','2026-07-13','2026-07-14','2026-07-13 04:36:23'),(15,9,'beach side ride','2026-07-21','2026-07-23','2026-07-21 14:50:42');
/*!40000 ALTER TABLE `itineraries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `itineraryitems`
--

DROP TABLE IF EXISTS `itineraryitems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `itineraryitems` (
  `id` int NOT NULL AUTO_INCREMENT,
  `itinerary_id` int NOT NULL,
  `attraction_id` int NOT NULL,
  `day_number` int DEFAULT NULL,
  `order_index` int DEFAULT NULL,
  `notes` text,
  PRIMARY KEY (`id`),
  KEY `ix_ItineraryItems_attraction_id` (`attraction_id`),
  KEY `ix_ItineraryItems_itinerary_id` (`itinerary_id`),
  CONSTRAINT `itineraryitems_ibfk_1` FOREIGN KEY (`attraction_id`) REFERENCES `attractions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `itineraryitems_ibfk_2` FOREIGN KEY (`itinerary_id`) REFERENCES `itineraries` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `itineraryitems`
--

LOCK TABLES `itineraryitems` WRITE;
/*!40000 ALTER TABLE `itineraryitems` DISABLE KEYS */;
INSERT INTO `itineraryitems` VALUES (7,3,12,1,4,NULL),(8,3,12,1,5,NULL),(9,3,9,1,6,NULL),(10,3,4,1,7,NULL),(11,3,8,1,8,NULL),(12,3,7,1,9,NULL),(13,3,10,2,0,NULL),(14,3,6,3,0,NULL),(15,4,9,2,0,NULL),(16,4,3,1,0,NULL),(17,5,10,1,0,NULL),(18,5,7,1,1,NULL),(19,9,6,1,0,NULL),(20,9,21,2,0,NULL),(21,10,14,1,0,NULL),(24,10,9,1,1,NULL),(25,10,20,2,0,NULL),(26,10,8,2,1,NULL),(27,10,7,3,0,NULL),(28,10,10,3,1,NULL),(29,10,11,3,2,NULL),(30,11,3,1,0,NULL),(31,11,14,1,1,NULL),(32,11,5,2,0,NULL),(33,11,13,2,1,NULL),(34,12,14,1,0,NULL),(36,12,3,1,2,NULL),(42,12,17,1,8,NULL),(43,12,9,1,9,NULL),(44,12,10,2,0,NULL),(46,12,7,2,1,NULL),(47,12,11,2,2,NULL),(49,12,20,2,3,NULL),(50,12,4,3,0,NULL),(51,12,8,3,1,NULL),(52,12,15,3,2,NULL),(53,12,12,3,3,NULL),(54,13,14,1,0,NULL),(55,13,9,1,1,NULL),(56,13,5,1,2,NULL),(57,13,10,2,0,NULL),(58,13,7,2,1,NULL),(59,13,11,2,2,NULL),(60,14,14,1,0,NULL),(61,14,5,1,1,NULL),(62,14,26,1,2,NULL),(63,14,20,2,0,NULL),(64,14,4,2,1,NULL);
/*!40000 ALTER TABLE `itineraryitems` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `uploadedimages`
--

DROP TABLE IF EXISTS `uploadedimages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `uploadedimages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `recognition_result` json DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_UploadedImages_user_id` (`user_id`),
  CONSTRAINT `uploadedimages_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `uploadedimages`
--

LOCK TABLES `uploadedimages` WRITE;
/*!40000 ALTER TABLE `uploadedimages` DISABLE KEYS */;
INSERT INTO `uploadedimages` VALUES (1,3,'/api/images/uploads/77d18c2849ea42c3b8690e5d7d165dbd.jpg','{\"confidence\": 0.97, \"description\": \"5th-century rock fortress and palace ruins with frescoes and water gardens, a UNESCO World Heritage Site.\", \"identified_name\": \"Sigiriya Rock Fortress\", \"matched_attraction_id\": 1}','2026-07-06 06:30:21'),(2,3,'/api/images/uploads/d9dffe376c394da4b1eaf3d9015aae6e.jpg','{\"confidence\": 0.94, \"description\": \"An iconic colonial-era railway viaduct set amid tea plantations and jungle.\", \"identified_name\": \"Nine Arch Bridge, Ella\", \"matched_attraction_id\": 4}','2026-07-06 06:30:41');
/*!40000 ALTER TABLE `uploadedimages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `email` varchar(255) NOT NULL,
  `firebase_uid` varchar(128) DEFAULT NULL,
  `preferences` json DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `is_admin` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `ix_Users_email` (`email`),
  UNIQUE KEY `ix_Users_firebase_uid` (`firebase_uid`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (3,'anushadk726','anushadk726@gmail.com','TSeRqajH3ldqPGJO9dtS877uI6E2',NULL,'2026-07-05 01:15:34',1),(6,'admin','admin@gmail.com','zODyPjJ3pJTeXnX3YAENCy1qT1I2','{\"pace\": \"moderate\", \"budget\": \"medium\", \"interests\": []}','2026-07-07 00:49:28',1),(9,'user','user@gmail.com','VkxhFhcr9mTK0UYULXCubKm8EDs1',NULL,'2026-07-07 00:57:29',0);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-22 10:52:47
