/*
SQLyog Ultimate v12.14 (64 bit)
MySQL - 10.4.27-MariaDB : Database - budget_muhammadiyah
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`budget_muhammadiyah` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;

USE `budget_muhammadiyah`;

/*Table structure for table `account` */

DROP TABLE IF EXISTS `account`;

CREATE TABLE `account` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nomor` varchar(191) NOT NULL,
  `nama_akun` varchar(191) NOT NULL,
  `unit_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `Account_unit_id_fkey` (`unit_id`),
  CONSTRAINT `Account_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `unit` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `account` */

insert  into `account`(`id`,`nomor`,`nama_akun`,`unit_id`,`is_active`) values 
(1,'5.1.1.01','Beban Operasional Pelayanan',NULL,1),
(2,'5.1.2.01','Beban Publikasi & Cetak',NULL,1),
(3,'5.1.3.01','Beban ATK & Fotokopi',NULL,1),
(4,'5.2.1.01','Beban Rapat & Konsumsi',NULL,1);

/*Table structure for table `activitytype` */

DROP TABLE IF EXISTS `activitytype`;

CREATE TABLE `activitytype` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama` varchar(191) NOT NULL,
  `unit_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `ActivityType_unit_id_fkey` (`unit_id`),
  CONSTRAINT `ActivityType_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `unit` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `activitytype` */

insert  into `activitytype`(`id`,`nama`,`unit_id`,`is_active`) values 
(1,'Rapat Kerja',NULL,1),
(2,'Pelatihan Kader',NULL,1),
(3,'Bakti Sosial',NULL,1),
(4,'Operasional Rutin',NULL,1),
(8,'Tes jenis kegiatan unit ',16,1),
(9,'tes',NULL,1);

/*Table structure for table `approval` */

DROP TABLE IF EXISTS `approval`;

CREATE TABLE `approval` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `proposal_id` int(11) NOT NULL,
  `approver_id` int(11) NOT NULL,
  `status` varchar(191) NOT NULL,
  `catatan` varchar(191) DEFAULT NULL,
  `tanggal` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `level_approval` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Approval_proposal_id_fkey` (`proposal_id`),
  KEY `Approval_approver_id_fkey` (`approver_id`),
  CONSTRAINT `Approval_approver_id_fkey` FOREIGN KEY (`approver_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `Approval_proposal_id_fkey` FOREIGN KEY (`proposal_id`) REFERENCES `proposal` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `approval` */

insert  into `approval`(`id`,`proposal_id`,`approver_id`,`status`,`catatan`,`tanggal`,`level_approval`) values 
(1,2,11,'APPROVE','ok acc bendahara mohon dibayar','2026-03-16 14:39:33.642',3),
(2,2,8,'APPROVE','setuju bayar ','2026-03-16 14:42:55.441',5),
(3,4,11,'APPROVE','ok setuju di bayar dengan perbaikan dari 8 juta menjadi 6 juta karena efisensi','2026-03-17 00:57:44.291',3),
(4,4,8,'APPROVE','bayar ya ','2026-03-17 00:59:06.483',5),
(5,5,11,'APPROVE','sudah sesuai ','2026-04-18 11:10:09.671',3),
(6,5,8,'APPROVE','Silahkan diambil','2026-04-18 11:17:50.247',5),
(7,3,11,'APPROVE','dibayarkan ','2026-04-18 11:34:06.281',3),
(8,3,8,'REJECT','diperbaikai','2026-04-18 11:35:12.253',5),
(9,3,9,'APPROVE','ok','2026-04-18 12:16:06.598',1),
(10,6,11,'APPROVE','','2026-04-18 12:17:03.115',3),
(11,6,8,'APPROVE','ok diambil besok senin jam kerja ','2026-04-18 12:17:29.202',5);

/*Table structure for table `approvalflow` */

DROP TABLE IF EXISTS `approvalflow`;

CREATE TABLE `approvalflow` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `urutan` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `label` varchar(191) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `ApprovalFlow_role_id_fkey` (`role_id`),
  CONSTRAINT `ApprovalFlow_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `approvalflow` */

insert  into `approvalflow`(`id`,`urutan`,`role_id`,`label`,`is_active`) values 
(15,1,101,'Langkah 1: Penginput Usulan (Input dan Cek Draft)',1),
(16,2,103,'Langkah 2: Review PDM (Verifikasi Anggaran)',1),
(17,3,5,'Langkah 3: Bendahara (Approval Akhir & Bayar)',1);

/*Table structure for table `expensereference` */

DROP TABLE IF EXISTS `expensereference`;

CREATE TABLE `expensereference` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama` varchar(191) NOT NULL,
  `unit_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `ExpenseReference_unit_id_fkey` (`unit_id`),
  CONSTRAINT `ExpenseReference_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `unit` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `expensereference` */

insert  into `expensereference`(`id`,`nama`,`unit_id`,`is_active`) values 
(1,'Biaya Konsumsi',NULL,1),
(2,'Biaya Transportasi & Akomodasi',NULL,1),
(3,'Honorarium Narasumber',NULL,1),
(4,'Pembelian Material ATK',NULL,1),
(5,'transport',NULL,0),
(6,'cetak baner',NULL,0);

/*Table structure for table `globalsetting` */

DROP TABLE IF EXISTS `globalsetting`;

CREATE TABLE `globalsetting` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `key` varchar(191) NOT NULL,
  `value` text NOT NULL,
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `GlobalSetting_key_key` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `globalsetting` */

insert  into `globalsetting`(`id`,`key`,`value`,`updatedAt`) values 
(1,'proker_start_date_15','2026-04-16T21:57','2026-04-16 14:57:56.936'),
(2,'proker_end_date_15','2026-04-16T21:58','2026-04-16 14:58:20.488'),
(3,'proker_start_date','','2026-04-17 06:50:57.781'),
(4,'proker_end_date','','2026-04-17 06:50:57.783'),
(5,'proker_start_date_1','2026-04-16T21:57','2026-04-16 14:57:33.329'),
(6,'proker_end_date_1','2026-04-24T21:57','2026-04-16 14:57:38.653');

/*Table structure for table `kas` */

DROP TABLE IF EXISTS `kas`;

CREATE TABLE `kas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tanggal` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `proposal_id` int(11) DEFAULT NULL,
  `tipe` varchar(191) NOT NULL,
  `kategori` varchar(191) DEFAULT NULL,
  `deskripsi` varchar(191) NOT NULL,
  `nominal` decimal(15,2) NOT NULL,
  `unit_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Kas_proposal_id_fkey` (`proposal_id`),
  KEY `Kas_unit_id_idx` (`unit_id`),
  KEY `Kas_tanggal_idx` (`tanggal`),
  CONSTRAINT `Kas_proposal_id_fkey` FOREIGN KEY (`proposal_id`) REFERENCES `proposal` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `kas` */

insert  into `kas`(`id`,`tanggal`,`proposal_id`,`tipe`,`kategori`,`deskripsi`,`nominal`,`unit_id`) values 
(1,'2026-03-16 00:00:00.000',2,'KELUAR','Usulan Anggaran','bayar diambil tunai olh joko','2000000.00',1),
(2,'2026-03-17 00:00:00.000',4,'KELUAR','Usulan Anggaran','bank mandiri','6000000.00',1),
(3,'2026-03-16 00:00:00.000',2,'MASUK','Dropping Dana dari PDM','Dropping dana usulan lama: Seni sastra dan tradisi','2000000.00',15),
(4,'2026-03-17 00:00:00.000',4,'MASUK','Dropping Dana dari PDM','Dropping dana usulan lama: Seni sastra dan tradisi 1','6000000.00',15),
(6,'2026-03-17 06:34:43.188',2,'KELUAR','Realisasi Kegiatan (SPJ)','Realisasi kegiatan: Seni sastra dan tradisi','500000.00',15),
(7,'2026-03-17 06:56:29.843',2,'KELUAR','Realisasi Kegiatan (SPJ)','Realisasi kegiatan: Seni sastra dan tradisi','750000.00',15),
(8,'2026-04-18 00:00:00.000',5,'KELUAR','Dropping Dana ke Unit','ditransferkan ke sekretaris lppk','150000.00',1),
(9,'2026-04-18 00:00:00.000',5,'MASUK','Dropping Dana dari PDM','Dropping dana usulan: PRA Got Talent Ke 1','150000.00',15);

/*Table structure for table `mastervisibility` */

DROP TABLE IF EXISTS `mastervisibility`;

CREATE TABLE `mastervisibility` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `reference_type` varchar(191) NOT NULL,
  `reference_id` int(11) NOT NULL,
  `unit_id` int(11) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `MasterVisibility_reference_type_reference_id_unit_id_key` (`reference_type`,`reference_id`,`unit_id`),
  KEY `MasterVisibility_unit_id_fkey` (`unit_id`),
  CONSTRAINT `MasterVisibility_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `unit` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=909 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `mastervisibility` */

insert  into `mastervisibility`(`id`,`reference_type`,`reference_id`,`unit_id`,`is_active`) values 
(366,'expense',1,1,0),
(367,'expense',1,24,0),
(368,'expense',1,25,0),
(369,'expense',1,26,0),
(370,'expense',1,27,0),
(371,'expense',1,28,0),
(372,'expense',1,29,0),
(373,'expense',1,30,0),
(374,'expense',1,31,0),
(375,'expense',1,32,0),
(376,'expense',1,33,0),
(377,'expense',1,34,0),
(378,'expense',1,35,0),
(379,'expense',1,36,0),
(380,'expense',1,37,0),
(381,'expense',1,38,0),
(382,'expense',1,39,0),
(383,'expense',1,2,0),
(384,'expense',1,3,0),
(385,'expense',1,4,0),
(386,'expense',1,5,0),
(387,'expense',1,6,0),
(388,'expense',1,7,0),
(389,'expense',1,8,0),
(390,'expense',1,9,0),
(391,'expense',1,10,0),
(392,'expense',1,11,0),
(393,'expense',1,12,0),
(394,'expense',1,13,0),
(395,'expense',1,14,0),
(396,'expense',1,15,1),
(397,'expense',1,16,0),
(398,'expense',1,17,0),
(399,'expense',1,18,0),
(400,'expense',1,19,0),
(401,'expense',1,20,0),
(402,'expense',1,21,0),
(403,'expense',1,22,0),
(404,'expense',1,23,0),
(405,'expense',1,40,0),
(406,'expense',1,41,0),
(407,'expense',1,42,0),
(408,'expense',1,43,0),
(409,'expense',1,44,0),
(410,'expense',1,45,0),
(411,'expense',1,46,0),
(412,'expense',1,47,0),
(413,'expense',1,48,0),
(414,'expense',1,49,0),
(415,'expense',1,50,0),
(416,'expense',1,51,0),
(417,'expense',1,52,0),
(418,'expense',1,53,0),
(419,'expense',1,99,0),
(420,'expense',1,100,0),
(421,'expense',1,151,0),
(422,'expense',1,101,0),
(423,'expense',1,102,0),
(424,'expense',1,103,0),
(425,'expense',1,62,0),
(426,'expense',1,63,0),
(427,'expense',1,64,0),
(428,'expense',1,81,0),
(429,'expense',1,82,0),
(430,'expense',1,57,0),
(431,'expense',1,58,0),
(432,'expense',1,59,0),
(433,'expense',1,60,0),
(434,'expense',1,61,0),
(435,'expense',1,70,0),
(436,'expense',1,71,0),
(437,'expense',1,54,0),
(438,'expense',1,55,0),
(439,'expense',1,56,0),
(440,'expense',1,83,0),
(441,'expense',1,84,0),
(442,'expense',1,85,0),
(443,'expense',1,67,0),
(444,'expense',1,68,0),
(445,'expense',1,69,0),
(446,'expense',1,96,0),
(447,'expense',1,97,0),
(448,'expense',1,98,0),
(449,'expense',1,93,0),
(450,'expense',1,94,0),
(451,'expense',1,95,0),
(452,'expense',1,65,0),
(453,'expense',1,66,0),
(454,'expense',1,72,0),
(455,'expense',1,73,0),
(456,'expense',1,77,0),
(457,'expense',1,78,0),
(458,'expense',1,79,0),
(459,'expense',1,80,0),
(460,'expense',1,86,0),
(461,'expense',1,87,0),
(462,'expense',1,88,0),
(463,'expense',1,89,0),
(464,'expense',1,90,0),
(465,'expense',1,91,0),
(466,'expense',1,92,0),
(467,'expense',1,74,0),
(468,'expense',1,75,0),
(469,'expense',1,76,0),
(470,'expense',1,104,0),
(471,'expense',1,105,0),
(472,'expense',1,106,0),
(473,'expense',1,107,0),
(474,'expense',1,108,0),
(475,'expense',1,109,0),
(476,'expense',1,110,0),
(477,'expense',1,111,0),
(478,'expense',1,112,0),
(479,'expense',1,113,0),
(480,'expense',1,114,0),
(481,'expense',1,115,0),
(482,'expense',1,116,0),
(483,'expense',1,117,0),
(484,'expense',1,118,0),
(485,'expense',1,119,0),
(486,'expense',1,120,0),
(487,'expense',1,121,0),
(488,'expense',1,122,0),
(489,'expense',1,123,0),
(490,'expense',1,124,0),
(491,'expense',1,125,0),
(492,'expense',1,126,0),
(493,'expense',1,127,0),
(494,'expense',1,128,0),
(495,'expense',1,129,0),
(496,'expense',1,130,0),
(497,'expense',1,131,0),
(498,'expense',1,132,0),
(499,'expense',1,133,0),
(500,'expense',1,134,0),
(501,'expense',1,135,0),
(502,'expense',1,136,0),
(503,'expense',1,137,0),
(504,'expense',1,138,0),
(505,'expense',1,139,0),
(506,'expense',1,140,0),
(507,'expense',1,141,0),
(508,'expense',1,142,0),
(509,'expense',1,143,0),
(510,'expense',1,144,0),
(511,'expense',1,145,0),
(512,'expense',1,146,0),
(513,'expense',1,147,0),
(514,'expense',1,148,0),
(515,'expense',1,149,0),
(516,'expense',1,150,0),
(517,'expense',1,152,0),
(518,'expense',1,153,0),
(519,'expense',1,154,0),
(520,'expense',1,155,0),
(521,'expense',2,1,0),
(522,'expense',2,2,0),
(523,'expense',2,3,0),
(524,'expense',2,4,0),
(525,'expense',2,5,0),
(526,'expense',2,6,0),
(527,'expense',2,7,0),
(528,'expense',2,8,0),
(529,'expense',2,9,0),
(530,'expense',2,10,0),
(531,'expense',2,11,0),
(532,'expense',2,12,0),
(533,'expense',2,13,0),
(534,'expense',2,14,0),
(536,'expense',2,16,0),
(537,'expense',2,17,0),
(538,'expense',2,18,0),
(539,'expense',2,19,0),
(540,'expense',2,20,0),
(541,'expense',2,21,0),
(542,'expense',2,22,0),
(543,'expense',2,23,0),
(544,'expense',2,24,0),
(545,'expense',2,25,0),
(546,'expense',2,26,0),
(547,'expense',2,27,0),
(548,'expense',2,28,0),
(549,'expense',2,29,0),
(550,'expense',2,30,0),
(551,'expense',2,31,0),
(552,'expense',2,32,0),
(553,'expense',2,33,0),
(554,'expense',2,34,0),
(555,'expense',2,35,0),
(556,'expense',2,36,0),
(557,'expense',2,37,0),
(558,'expense',2,38,0),
(559,'expense',2,39,0),
(560,'expense',2,40,0),
(561,'expense',2,41,0),
(562,'expense',2,42,0),
(563,'expense',2,43,0),
(564,'expense',2,44,0),
(565,'expense',2,45,0),
(566,'expense',2,46,0),
(567,'expense',2,47,0),
(568,'expense',2,48,0),
(569,'expense',2,49,0),
(570,'expense',2,50,0),
(571,'expense',2,51,0),
(572,'expense',2,52,0),
(573,'expense',2,53,0),
(574,'expense',2,54,0),
(575,'expense',2,55,0),
(576,'expense',2,56,0),
(577,'expense',2,57,0),
(578,'expense',2,58,0),
(579,'expense',2,59,0),
(580,'expense',2,60,0),
(581,'expense',2,61,0),
(582,'expense',2,62,0),
(583,'expense',2,63,0),
(584,'expense',2,64,0),
(585,'expense',2,65,0),
(586,'expense',2,66,0),
(587,'expense',2,67,0),
(588,'expense',2,68,0),
(589,'expense',2,69,0),
(590,'expense',2,70,0),
(591,'expense',2,71,0),
(592,'expense',2,72,0),
(593,'expense',2,73,0),
(594,'expense',2,74,0),
(595,'expense',2,75,0),
(596,'expense',2,76,0),
(597,'expense',2,77,0),
(598,'expense',2,78,0),
(599,'expense',2,79,0),
(600,'expense',2,80,0),
(601,'expense',2,81,0),
(602,'expense',2,82,0),
(603,'expense',2,83,0),
(604,'expense',2,84,0),
(605,'expense',2,85,0),
(606,'expense',2,86,0),
(607,'expense',2,87,0),
(608,'expense',2,88,0),
(609,'expense',2,89,0),
(610,'expense',2,90,0),
(611,'expense',2,91,0),
(612,'expense',2,92,0),
(613,'expense',2,93,0),
(614,'expense',2,94,0),
(615,'expense',2,95,0),
(616,'expense',2,96,0),
(617,'expense',2,97,0),
(618,'expense',2,98,0),
(619,'expense',2,99,0),
(620,'expense',2,100,0),
(621,'expense',2,101,0),
(622,'expense',2,102,0),
(623,'expense',2,103,0),
(624,'expense',2,104,0),
(625,'expense',2,105,0),
(626,'expense',2,106,0),
(627,'expense',2,107,0),
(628,'expense',2,108,0),
(629,'expense',2,109,0),
(630,'expense',2,110,0),
(631,'expense',2,111,0),
(632,'expense',2,112,0),
(633,'expense',2,113,0),
(634,'expense',2,114,0),
(635,'expense',2,115,0),
(636,'expense',2,116,0),
(637,'expense',2,117,0),
(638,'expense',2,118,0),
(639,'expense',2,119,0),
(640,'expense',2,120,0),
(641,'expense',2,121,0),
(642,'expense',2,122,0),
(643,'expense',2,123,0),
(644,'expense',2,124,0),
(645,'expense',2,125,0),
(646,'expense',2,126,0),
(647,'expense',2,127,0),
(648,'expense',2,128,0),
(649,'expense',2,129,0),
(650,'expense',2,130,0),
(651,'expense',2,131,0),
(652,'expense',2,132,0),
(653,'expense',2,133,0),
(654,'expense',2,134,0),
(655,'expense',2,135,0),
(656,'expense',2,136,0),
(657,'expense',2,137,0),
(658,'expense',2,138,0),
(659,'expense',2,139,0),
(660,'expense',2,140,0),
(661,'expense',2,141,0),
(662,'expense',2,142,0),
(663,'expense',2,143,0),
(664,'expense',2,144,0),
(665,'expense',2,145,0),
(666,'expense',2,146,0),
(667,'expense',2,147,0),
(668,'expense',2,148,0),
(669,'expense',2,149,0),
(670,'expense',2,150,0),
(671,'expense',2,151,0),
(672,'expense',2,152,0),
(673,'expense',2,153,0),
(674,'expense',2,154,0),
(675,'expense',2,155,0),
(677,'expense',2,15,1),
(679,'expense',3,1,1),
(839,'expense',3,15,1),
(840,'account',1,27,1),
(841,'account',1,13,1),
(842,'account',1,14,1),
(843,'account',1,15,1),
(844,'account',1,16,1),
(845,'account',1,17,1),
(846,'account',1,18,1),
(847,'account',1,19,1),
(848,'account',1,20,1),
(849,'account',1,21,1),
(850,'account',1,22,1),
(851,'account',1,2,1),
(852,'account',1,3,1),
(853,'account',1,4,1),
(854,'account',1,5,1),
(855,'account',1,6,1),
(856,'account',1,7,1),
(857,'account',1,8,1),
(858,'account',1,9,1),
(859,'account',1,10,1),
(860,'account',1,11,1),
(861,'account',1,12,1),
(862,'account',1,23,1),
(863,'account',2,27,1),
(864,'account',2,2,1),
(865,'account',2,3,1),
(866,'account',2,4,1),
(867,'account',2,5,1),
(868,'account',2,6,1),
(869,'account',2,7,1),
(870,'account',2,8,1),
(871,'account',2,9,1),
(872,'account',2,10,1),
(873,'account',2,11,1),
(874,'account',2,12,1),
(875,'account',2,23,1),
(876,'account',2,13,1),
(877,'account',2,14,1),
(878,'account',2,15,1),
(879,'account',2,16,1),
(880,'account',2,17,1),
(881,'account',2,18,1),
(882,'account',2,19,1),
(883,'account',2,20,1),
(884,'account',2,21,1),
(885,'account',2,22,1),
(886,'activity',1,27,1),
(887,'activity',1,2,1),
(888,'activity',1,3,1),
(889,'activity',1,4,1),
(890,'activity',1,5,1),
(891,'activity',1,6,1),
(892,'activity',1,7,1),
(893,'activity',1,8,1),
(894,'activity',1,9,1),
(895,'activity',1,10,1),
(896,'activity',1,11,1),
(897,'activity',1,12,1),
(898,'activity',1,23,1),
(899,'activity',1,13,1),
(900,'activity',1,14,1),
(901,'activity',1,15,1),
(902,'activity',1,16,1),
(903,'activity',1,17,1),
(904,'activity',1,18,1),
(905,'activity',1,19,1),
(906,'activity',1,20,1),
(907,'activity',1,21,1),
(908,'activity',1,22,1);

/*Table structure for table `menu` */

DROP TABLE IF EXISTS `menu`;

CREATE TABLE `menu` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama_menu` varchar(191) NOT NULL,
  `path` varchar(191) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Menu_path_key` (`path`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `menu` */

insert  into `menu`(`id`,`nama_menu`,`path`) values 
(1,'Dashboard','/dashboard'),
(2,'Program Kerja Tahunan','/dashboard/proker'),
(3,'Usulan Anggaran','/dashboard/proposals'),
(4,'Persetujuan (Approval)','/dashboard/approvals'),
(5,'Laporan Pendanaan (LPJ)','/dashboard/pertanggungjawaban'),
(6,'Master Data Referensi','/dashboard/master'),
(7,'Alur Persetujuan','/dashboard/approval-flow'),
(8,'Manajemen Unit','/dashboard/units'),
(9,'Manajemen Pengguna','/dashboard/users'),
(10,'Hak Akses','/dashboard/menus'),
(11,'Persetujuan SPJ','/dashboard/pertanggungjawaban/approvals'),
(12,'Buku Kas (Bendahara)','/dashboard/kas'),
(13,'Manajemen Pagu Unit','/dashboard/pagu'),
(14,'Pengaturan Sistem','/dashboard/settings');

/*Table structure for table `permission` */

DROP TABLE IF EXISTS `permission`;

CREATE TABLE `permission` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role_id` int(11) NOT NULL,
  `menu_id` int(11) NOT NULL,
  `can_create` tinyint(1) NOT NULL DEFAULT 0,
  `can_read` tinyint(1) NOT NULL DEFAULT 0,
  `can_update` tinyint(1) NOT NULL DEFAULT 0,
  `can_delete` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Permission_role_id_menu_id_key` (`role_id`,`menu_id`),
  KEY `Permission_menu_id_fkey` (`menu_id`),
  CONSTRAINT `Permission_menu_id_fkey` FOREIGN KEY (`menu_id`) REFERENCES `menu` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `Permission_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=112 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `permission` */

insert  into `permission`(`id`,`role_id`,`menu_id`,`can_create`,`can_read`,`can_update`,`can_delete`) values 
(10,5,11,1,1,1,1),
(11,99,11,1,1,1,1),
(12,99,1,1,1,1,1),
(13,99,2,1,1,1,1),
(14,99,3,1,1,1,1),
(15,99,4,1,1,1,1),
(16,99,5,1,1,1,1),
(17,99,6,1,1,1,1),
(18,99,7,1,1,1,1),
(19,99,8,1,1,1,1),
(20,99,9,1,1,1,1),
(21,99,10,1,1,1,1),
(22,99,12,1,1,1,1),
(23,5,1,1,1,1,0),
(24,5,2,1,1,1,0),
(25,5,3,1,1,1,0),
(26,5,4,1,1,1,0),
(27,5,5,1,1,1,0),
(28,5,12,1,1,1,0),
(41,99,13,1,1,1,1),
(42,99,14,1,1,1,1),
(43,100,1,1,1,1,1),
(44,100,2,1,1,1,1),
(45,100,3,1,1,1,1),
(46,100,4,1,1,1,1),
(47,100,5,1,1,1,1),
(48,100,6,1,1,1,1),
(49,100,7,1,1,1,1),
(50,100,8,1,1,1,1),
(51,100,9,1,1,1,1),
(52,100,10,1,1,1,1),
(53,100,11,1,1,1,1),
(54,100,12,1,1,1,1),
(55,100,13,1,1,1,1),
(56,100,14,1,1,1,1),
(74,103,1,1,1,1,1),
(75,103,2,1,1,1,1),
(76,103,3,1,1,1,1),
(77,103,4,1,1,1,1),
(78,103,5,1,1,1,1),
(79,103,6,0,1,0,0),
(80,103,7,0,1,0,0),
(81,103,11,1,1,1,1),
(82,103,12,1,1,1,1),
(83,103,13,0,1,0,0),
(84,102,2,1,1,1,1),
(85,102,3,1,1,1,1),
(86,102,4,1,1,1,1),
(87,102,11,1,1,1,1),
(105,101,1,1,1,1,1),
(106,101,2,1,1,1,1),
(107,101,3,1,1,1,1),
(108,101,4,1,1,1,1),
(109,101,5,1,1,1,1),
(110,101,6,1,1,1,1),
(111,101,12,1,1,1,1);

/*Table structure for table `pertanggungjawaban` */

DROP TABLE IF EXISTS `pertanggungjawaban`;

CREATE TABLE `pertanggungjawaban` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `proposal_id` int(11) NOT NULL,
  `tanggal_laporan` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `ringkasan` text NOT NULL,
  `total_realisasi` decimal(15,2) NOT NULL,
  `file_laporan` varchar(191) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'SUBMITTED',
  `nama_bendahara` varchar(191) DEFAULT NULL,
  `nama_pembuat` varchar(191) DEFAULT NULL,
  `nama_pimpinan` varchar(191) DEFAULT NULL,
  `opsi_sisa` varchar(191) NOT NULL DEFAULT 'KEMBALI',
  `sisa_dana` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_diterima` decimal(15,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `Pertanggungjawaban_status_idx` (`status`),
  KEY `Pertanggungjawaban_proposal_id_idx` (`proposal_id`),
  CONSTRAINT `Pertanggungjawaban_proposal_id_fkey` FOREIGN KEY (`proposal_id`) REFERENCES `proposal` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `pertanggungjawaban` */

insert  into `pertanggungjawaban`(`id`,`proposal_id`,`tanggal_laporan`,`ringkasan`,`total_realisasi`,`file_laporan`,`status`,`nama_bendahara`,`nama_pembuat`,`nama_pimpinan`,`opsi_sisa`,`sisa_dana`,`total_diterima`) values 
(8,2,'2026-03-17 06:34:26.270','tes parsial ke 1','500000.00',NULL,'APPROVED_FINAL','','Rama','','LANJUT','1500000.00','2000000.00'),
(9,2,'2026-03-17 06:56:01.172','spj ke 2','750000.00',NULL,'REJECTED','','Rama','','LANJUT','750000.00','2000000.00'),
(10,2,'2026-03-17 06:56:01.255','spj ke 2','750000.00',NULL,'APPROVED_FINAL','','Rama','','LANJUT','0.00','2000000.00'),
(11,2,'2026-04-17 08:37:02.938','tes spj ke 2 ','75000.00',NULL,'SUBMITTED','tes bend','Ramadhani Gafar Utama, SE., M.M.','tes pimp','KEMBALI','675000.00','2000000.00');

/*Table structure for table `pertanggungjawabandetail` */

DROP TABLE IF EXISTS `pertanggungjawabandetail`;

CREATE TABLE `pertanggungjawabandetail` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pj_id` int(11) NOT NULL,
  `account_id` int(11) NOT NULL,
  `keterangan` varchar(191) NOT NULL,
  `nominal` decimal(15,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `PertanggungjawabanDetail_pj_id_fkey` (`pj_id`),
  KEY `PertanggungjawabanDetail_account_id_fkey` (`account_id`),
  CONSTRAINT `PertanggungjawabanDetail_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `PertanggungjawabanDetail_pj_id_fkey` FOREIGN KEY (`pj_id`) REFERENCES `pertanggungjawaban` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `pertanggungjawabandetail` */

insert  into `pertanggungjawabandetail`(`id`,`pj_id`,`account_id`,`keterangan`,`nominal`) values 
(11,8,2,'dfsafa','500000.00'),
(12,9,2,'fadsf','750000.00'),
(13,10,2,'fadsf','750000.00'),
(14,11,2,'cetak nota','50000.00'),
(15,11,3,'fotocopy','25000.00');

/*Table structure for table `programkerja` */

DROP TABLE IF EXISTS `programkerja`;

CREATE TABLE `programkerja` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `unit_id` int(11) NOT NULL,
  `periode_tahun` int(11) NOT NULL,
  `nama_kegiatan` varchar(191) NOT NULL,
  `sifat_kegiatan` varchar(191) NOT NULL,
  `uraian_kegiatan` text DEFAULT NULL,
  `lembaga_mitra` varchar(191) DEFAULT NULL,
  `sasaran` text DEFAULT NULL,
  `tujuan` text DEFAULT NULL,
  `strategi` text DEFAULT NULL,
  `indikator` text DEFAULT NULL,
  `anggaran_setahun` decimal(15,2) NOT NULL,
  `tanggal_mulai` datetime(3) DEFAULT NULL,
  `tanggal_selesai` datetime(3) DEFAULT NULL,
  `keterangan` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `dibuat_oleh_id` int(11) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `ProgramKerja_unit_id_fkey` (`unit_id`),
  KEY `ProgramKerja_dibuat_oleh_id_fkey` (`dibuat_oleh_id`),
  CONSTRAINT `ProgramKerja_dibuat_oleh_id_fkey` FOREIGN KEY (`dibuat_oleh_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `ProgramKerja_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `unit` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=135 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `programkerja` */

insert  into `programkerja`(`id`,`unit_id`,`periode_tahun`,`nama_kegiatan`,`sifat_kegiatan`,`uraian_kegiatan`,`lembaga_mitra`,`sasaran`,`tujuan`,`strategi`,`indikator`,`anggaran_setahun`,`tanggal_mulai`,`tanggal_selesai`,`keterangan`,`is_active`,`dibuat_oleh_id`,`createdAt`) values 
(1,15,2026,'Latihan Teater','Pokok','Menyelenggarakan Kegiatan Latihan Teater',NULL,'Latihan seminggu sekali untuk anak muda usia sekolah','Menyiapkan generasi muda Muhammadiyah menguasai dasar-dasar wawasan teater, baik keaktoran, penyutradaraan, tata artistik, manajemen produksi dan penulisan naskah','Menyelenggarakan latihan dengan menggunakan silabus yang terencana dan terukur','Terlaksananya kegiatan latihan secara teratur seminggu sekali dengan menggandeng (kerjasama) dengan Kelompok Teater Sastro Mbeling Yogyakarta sebagai mentor setiap pertemuan latihan.','50000000.00','2026-03-01 00:00:00.000','2026-05-31 00:00:00.000','',1,9,'2026-03-16 12:12:21.846'),
(2,15,2026,'PRA Got Talent','Pokok','Kegiatan pencarian bakat untuk PRA se Kota DIY',NULL,'PRA se Kota','Mencari bibit berbakat dari kalangan PRA','Kompetisi bakat dibidang seni ','Terlaksananya kompetisi yang diikuti oleh seluruh PRA se Kota Yogyakarta','15000000.00','2026-03-01 00:00:00.000','2026-08-31 00:00:00.000','',1,9,'2026-03-16 13:47:41.603'),
(3,15,2026,'Seni sastra dan tradisi','Bantu','Pentas seni karawitan',NULL,'Latihan nabuh gamelan ','Pentas karawitan','Para anggota lsb kolaborasi dengan guru2 SMA muh 5 Yogyakarta menggelar pentas karawitan','Memperingati Hari Besar Islam atau Nasional','10000000.00','2026-03-01 00:00:00.000','2026-09-30 00:00:00.000','',1,9,'2026-03-16 13:49:24.908'),
(4,15,2026,'Seni sastra dan tradisi','Pokok','Pelatihan Penulisan dan Digitalisasi Aksara Jawa',NULL,'Pelajar Muhammadiyah dari jenjang SMP-SMA\nWarga Muhammadiyah di Kota Yogyakarta ','Mengenalkan sekaligus melestarikan warisan budaya berupa Aksara Jawa kepada seluruh warga Muhammadiyah agar dapat menjadi salah satu komponen yang dipertimbangkan agar font Aksara Jawa diakui oleh dunia',' Program ini bisa bekerja sama atau kolaborasi dengan Dinas Kebudayaan','Terlaksananya Pelatihan Penulisan dan digitalisasi aksara jawa','25000000.00','2026-03-31 00:00:00.000','2026-03-16 00:00:00.000','',1,9,'2026-03-16 13:50:37.592'),
(5,2,2026,'Rapat dan kajian rutin anggota MTT PDM Kota Yogyakarta','Pokok','1)  Rapat Membahas Kegiatan, 2)  Kajian Fatwa Kontemporer',NULL,'Pimpinan Majelis','Menyiapkan dan mengevaluasi kegiatan serta membahas tema-tema aktual','Undangan dan Penugasan dan pembagian tema kajian','Terlaksana Rapat dan kajian','0.00','2026-01-01 00:00:00.000','2026-06-30 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(6,2,2026,'Mudaarasah','Pokok','Menyusun Pedoman Wisata Islami',NULL,'Anggota Pimpinan, AUM, Cabang Ranting, ‘Aisyiyah','Menambah dan menguatkan paham terkait tuntunan berwisata secara Islami ','Undangan, Penyusunan tema, Pembagian tugas, Pelaksanaan dan Evaluasi','Terpublikasinya hasil mudaarasah','20000000.00','2026-01-01 00:00:00.000','2026-02-28 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(7,2,2026,'Penerbitan Buku ','Pokok','Menerbitkan buku pedoman Wisata Islami',NULL,'Anggota Pimpinan, AUM, Cabang Ranting, ‘Aisyiyah','Dapat menjadi rujukan pedoman dalam berwisata ','Pembagian buku pedoman wisata Islami','Terbagikan buku pedoman wisata Islami ','20000000.00','2026-04-01 00:00:00.000','2026-04-30 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(8,2,2026,'Sosialisasi Produk Ketarjihan','Bantu','Menjadi Narasumber Pengajian Ketarjihan',NULL,'PCM, PRM, AUM, Ortom','Mensosialisasikan materi-materi Ketarjihan',' Pembagian tugas, Pembagian materi dan Komunikasi dengan PCM, PRM se-Kota Jogja','Terlaksana minimal 3 kali kunjungan ke Cabang/Ranting','10000000.00','2026-01-01 00:00:00.000','2026-06-30 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(9,10,2026,'Organisai dan Kepemimpinan','Pokok','Rapat Rutin',NULL,'Pengurus MPM PDM','Rapat perencanaan, monitoring, evaluasi kegiatan','Rapat ','Terlaksananya rapat rutin untuk melakukan monitoring dan evaluasi program kegiatan','2400000.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(10,10,2026,'Organisai dan Kepemimpinan','Pokok','Rapat Kerja Daerah (Rakerda) ',NULL,'Pengurus MPM PDM dan Pengurus MPM PCM','Menyusun program kerja MPM dan sosialisasi program kerja ','Rapat ','Raker terlaksana dengan dihadiri perwakilan MPM PWM, anggota MPM PDM dan PCM, program kerja tersusun','3000000.00','2026-03-01 00:00:00.000','2026-04-30 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(11,10,2026,'Jaringan','Bantu','Melaksanakan program pemberdayaan masyarakat bekerjasama dengan pihak eksternal',NULL,'Anggota PCM sasaran pemberdayaan (mustad\'afin)','Membangun kemitraan/ jaringan pihak eksternal dalam pemberdayaan masyarakat','Kerjasama dengan mitra (Kampus, pemerintah, organsasi lain, dan atau majelis lembaga di PDM)','Terjalinnya kerjasama dengan mitra untuk pemberdayaan masyarakat','5000000.00','2026-08-01 00:00:00.000','2026-09-30 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(12,10,2026,'Jaringan','Bantu','Melaksanakan program pemberdayaan masyarakat bekerjasama dengan pihak eksternal (MLH, MPKS, MEK atau dengan Majelis atau Lembaga yg lainnya)',NULL,'Anggota JATAM, JagalMu dan JPM','Membangun kemitraan/ jaringan pihak internal dalam pemberdayaan masyarakat','Kerjasama dengan JATAM, JagalMu dan JPM atau yg lainnya.','Terjalinnya kerjasama dengan mitra internal untuk pemberdayaan masyarakat','10000000.00','2026-06-01 00:00:00.000','2026-12-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(13,10,2026,'Sumber Daya','Bantu','Peningkatan kualitas SDM pengurus MPM dan masyarakat sasaran (mustad\'afin)',NULL,'Pengurus MPM PDM, Pengurus MPM PCM, JATAM, JagalMu, JPM dan Anggota masyarakat sasaran','Meningkatkan kualitas SDM pemberdayaan masyarakat dan masyarakat sasaran','Pendidikan dan Latihan/ Training of Trainer ','Terlaksananya program peningkatan SDM (Pelatihan tali temali, perebahan, penyembelihan, pengulitan, pengolahan dll bagi JagalMu), kajian figh dan manajemen kurban','10000000.00','2026-05-01 00:00:00.000','2026-10-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(14,10,2026,'Aksi Pelayanan','Pokok','Pemberdayaan masyarakat melalui kegiatan pertanian, perikanan dan pengolahan sampah dengan sistem simbiotik kerjasama dengan MLH atau Majelis/Lembaga lainnya.',NULL,'Masyarakat sasaran (mustad\'afin) di tingkat PCM','Memberdayakan masyakarakat melalui kegiatan pertanian, perikanan, dan pengolahan sampah secara simbiotik (saling terpadu dan menguntungkan)','Praktik secara langsung pengeloaan pertanian, perikanan, dan pengolahan sampah secara terpadu ','Terbentuknya 1 pilot proyek pemberdayaan masyarakat melalui pertanian dan perikanan secara terpadu (perikanan, pertanian, pengolahan sampah organik, produksi pakan dll)','10000000.00','2026-11-01 00:00:00.000','2026-11-30 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(15,6,2026,'Rapat Rutin','Pokok','Rapat rutin Anggota MPKU',NULL,' Anggota MPKU','Koodinasi Organisasi','Rapat dengan Offline dan Online','Rapat Rutin terlaksana','0.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','Anggaran PDM dan dilaksananakn 1 bulan 1x',1,4,'2026-04-15 16:23:00.000'),
(16,6,2026,'Raker MPKU','Pokok','Seluruh Anggota MPKU',NULL,' Tersusunnya Program Kerja','Koodinasi Organisasi','Rapat dengan Offline dan Online','Raker terlaksana','0.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','1 kali dalam setahun',1,4,'2026-04-15 16:23:00.000'),
(17,6,2026,'Rapat Koordinasi dengan Aum Kes yang ada ','Pokok','Berkoordinasi dengan AUMKes yang ada di Kota Yogyakarta',NULL,'Klinik Pratama UH, PKU Kotagede, Klinik Pratama 24 Jam Firdaus, RS AMC Muhammadiyah, RSGM UMY','Koodinasi Organisasi',NULL,NULL,'3000000.00','2026-02-01 00:00:00.000','2026-10-31 00:00:00.000','Februari, Mei, Oktober',1,4,'2026-04-15 16:23:00.000'),
(18,6,2026,'Edukasi Kesehatan Remaja Usia Sekolah','Pokok','Menjadi pembina kader kesehatan di sekolah sesuai dengan kebutuhan bekerjasama dengan Majelis terkain dan AUM terkait',NULL,'Untuk Siswa SMA,SMP dan SD','Menjadi perogram unggulan sekolah untuk terciptanya kader kesehatan di sekolah di berbagai level pendidikan ','Bekerjasama dengan DIKDASMEN dan AUM Pendidikan ',NULL,'10000000.00','2026-03-01 00:00:00.000','2026-08-31 00:00:00.000','Maret,Juni, Agustus',1,4,'2026-04-15 16:23:00.000'),
(19,6,2026,'Up Grading','Bantu','Pemberian pengetauhaun untuntuk kru ambulace se-Kota Yogyakarta',NULL,'Bantu+E11','Meningkatnya pengetahuan kru Ambulance Muhammadiyah di kota Yogyakarta tentang kesehatan dan aturan lainya','Bekerjasama dengan Mejelis Lain (MPS)',NULL,'15000000.00','2026-08-01 00:00:00.000','2026-12-31 00:00:00.000','Agustus, oktober, desember',1,4,'2026-04-15 16:23:00.000'),
(20,6,2026,'Peningkatan Kapasitas (Softskill, dan Kemuhammadiyahan) untuk Pegawai AUMKES Se-kota Yogyakarta','Pokok','Pelatihan dan seminar untuk Karyawan AUMKES dilaksankan 6 bulan sekali 2x dalam setahun',NULL,'Pegawai AUMKES Se-Kota Yogyakarta','Meningkatnya mutu pelayanan Pegawai AUMKES Se-Kota Yogyakarta','Koordinasi dengan PCM Terkait dan AUM Kes Terkait',NULL,'30000000.00','2026-03-01 00:00:00.000','2026-10-31 00:00:00.000','Maret dan Oktober',1,4,'2026-04-15 16:23:00.000'),
(21,6,2026,'Aksi Donor Darah ','Bantu','Pelaksanaan donor di PDM bekerjasama dengan Majelis lain (MPS dan LAZIS)',NULL,' Masyarakat Umum, AUM, Simpatisan, dan Warga Muhyammadiyah','Memberikan kemanfaatan bagi Masyarakat Umum, AUM, Simpatisan, dan Warga Muhyammadiyah','Bersama Majelis Lain',NULL,'25000000.00','2026-11-01 00:00:00.000','2026-11-30 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(22,6,2026,'Pemeriksaan Dan Pengobatan Gratis.','Bantu','Pelaksanaan Pemeriksaaan dan pengobatan Gratis di PDM bekerjasama dengan Majelis lain (MPS dan LAZIS)',NULL,' Masyarakat Umum, AUM, Simpatisan, dan Warga Muhyammadiyah','Memberikan kemanfaatan bagi Masyarakat Umum, AUM, Simpatisan, dan Warga Muhyammadiyah','Bersama Majelis Lain',NULL,'20000000.00','2026-11-01 00:00:00.000','2026-11-30 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(23,6,2026,'Mengadakan Sunatan Massal','Pokok','Pelaksanaan Sunatan masal Gratis di PDM bekerjasama dengan Majelis lain (MPS dan LAZIS)',NULL,' Masyarakat Umum, AUM, Simpatisan, dan Warga Muhyammadiyah','Memberikan kemanfaatan bagi Masyarakat Umum, AUM, Simpatisan, dan Warga Muhyammadiyah','Bersama Majelis Lain',NULL,'35000000.00','2026-12-01 00:00:00.000','2026-12-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(24,6,2026,'Pemeriksaan Kesehatan Untuk Pimpinan dan Ketua Majelis','Pokok','Melaksanakan Pemeriksaan Kesehatan Untuk pimpinan 1 bulan sekali saat rapat rutin pimpinan dan Majelis',NULL,'Pimpinan PDM Kota Yogyakarta, Ketua Majelis PDM Kota Yogyakarta','terjadi Screing kesehatan untuk Pimpinan dan Ketua Majelis lembaga PDM Kota yogyakarta','Menyiapkan tim saat rapat rutin',NULL,'5700000.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','Setiap Bulan Januari - Desember',1,4,'2026-04-15 16:23:00.000'),
(25,5,2026,'Baitul Arqom AUM','Pokok','Ceramah , Diskusi, Simulasi, Kajian Ayat, Out Bound',NULL,'Guru dan Karyawan AUM','Melaksanakan Perkaderan Formal dan Melahirkan Kader Muhammadiyah','Penanaman Ideologi KeIslaman dan ke Muhammadiyahan','Terlaksananya RTL Keaktifan oleh setiap peserta','0.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(26,5,2026,'Baitul Arqom PCM ','Pokok','Ceramah , Diskusi, Simulasi, Kanji Ayah, Out Bound',NULL,'PCM, PRM , dan ORTOMKotYogyakarta','Melaksanakan Perkaderan Formal dan Melahirkan Kader Muhammadiyah','Penanaman Ideologi KeIslaman dan ke Muhammadiyahan','Terlaksananya RTL oleh setiap peserta','0.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(27,5,2026,'Bait Arqom PRM','Pokok','Ceramah , Diskusi, Simulasi, Kanji Ayah, Out Bound',NULL,'Anngota PRM di salah satu PCM','Melaksanakan Perkaderan Formal dan Melahirkan Kader Muhammadiyah','Penanaman Ideologi KeIslaman dan ke Muhammadiyahan','Lomba dan Pentas Seni Islami','0.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(28,5,2026,'Kemah Keluarga Muhammadiyah','Pokok','Kemah,Pentas seni, pmebekalan , Out Bound',NULL,'Anak, istri , keluarga Pimpinan Muhammadiyah','Menyatukan Persepsi dan Pemahaman tentang Ideologi Politik Organisasi ',' Mengajak keluarga dalam gerakan Muhammadiyah','Materi, Sarasehan, Brain storming','30000000.00','2026-06-27 00:00:00.000','2026-06-28 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(29,5,2026,'Refreshing Ideologi','Pokok','Ceramah, Diskusi',NULL,'AnggotaMajelis Lembaga PDM Kota Yogyakarta','Koordinasi Persiapan Sekolah Kader dan Baitul Arqom Remaja Masjid','Penguatan dan penyegaran pemahaman dan implementasi ber Muhammadiyah','Materi, Sarasehan, Brain storming','15000000.00','2026-04-18 00:00:00.000','2026-04-19 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(30,5,2026,' Festival Masjid Muh. Yogya ','Pokok','Lomba dan Pentas Seni Islami',NULL,'Remaja dan Musholla dan Takmir Masjid Muhammadiyah ','Melahirkan Kader Muda Muhammadiyah dengan Pemahaman Ideologi yang kuat','Penguatan Ideologi melalui Syi\'ar Muhammadiyah ','Kajian Materi, Praktik, Penugasan ','15000000.00','2026-07-18 00:00:00.000','2026-07-19 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(31,5,2026,'Jogja Takbir Festival','Pokok','Takbir, Defile, Show creatifitas',NULL,'Masjid Se Kota Yogyakarta','MPKSDI PDM Kota Yogyakarta memiliki Data Kader Muhammadiyah ','Syiar Muhammadiyah kepada masyarakat umum','Ceramah, Diskusi, Pemagangan, Out door class','20000000.00','2026-05-30 00:00:00.000','2026-05-30 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(32,5,2026,'Safari Masjid Muh Yogyakarta','Pokok','Silaturahmi, Ceramah',NULL,'Masjid-masjid PCM se Kota Yogyakarta','Melahirkan Kader berbasis masjid dengan Pemahaman Ideologi yang kuat','Perkaderan lewat silaturahmi','Ceramah, Diskusi, game, di alam terbuka','6000000.00','2026-04-01 00:00:00.000','2026-06-30 00:00:00.000','16 April, 21 Mei, 18 Juni',1,4,'2026-04-15 16:23:00.000'),
(33,5,2026,'Pengajian Ramadhan','Pokok','Kajian dan Pendalaman kualitas ilmi pimpinan Kota Yogyakarta',NULL,'Anggota PDM, MajelisLembaga, PCM,PRM,ORTOM, dan Pimpinan AUM, ','Menyamakan Persepsi dan Meningkatkan Kualitas Instruktur MPKSDI Kota Yogyakarta','Penanaman Wawasan Ideologi KeIslaman dan ke Muhammadiyahan','Materi, Sarasehan, Brain storming, Simulasi','8000000.00','2026-03-07 00:00:00.000','2026-03-08 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(34,5,2026,'Kajian Kader Komunitas','Pokok',' Baksos dan Pengajian',NULL,'Komunitas Abang beca, Tukang sapu, Pedagang Kecil, Pengamen','Memantau dan Meningkatkan Perkaderan di lingkup Kota Yogyakarta','Membuka ruang perkaderan out the box','Silaturahim, Kosolidasi Program','8000000.00','2026-09-20 00:00:00.000','2026-09-20 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(35,5,2026,'Sekolah Kader Mubaligh','Pokok','Kunjungan Silaturahmi ke PRM se Kota terkait perkembangan Perkaderan di MPKSDI PCM dan ORTOM tingkat Cabang',NULL,'Kader muda PRM,PCM, ORTOM','Melahirkan Kader Mubaligh Muhammadiyah yang ideologis','Mencetak kader yang berkualitas dan berdaya profesional','Silaturahmi dan mengisi Kajian','25000000.00','2026-10-01 00:00:00.000','2026-12-04 00:00:00.000','2,9,16,23,30, Okt, 6,12,20,27 Nov, 4 Des',1,4,'2026-04-15 16:23:00.000'),
(36,5,2026,'Makrab Kader Ortom','Pokok',' Peneguhan by kegiatan ceria dan out bound',NULL,'ORTOM Tingkat Daerah dan PCM','Melahirkan Kegiatan yang dapat memaksimalkan Potensi Kader di tingkat Daerah','Menguatkan karakter dan komitmen kader','Silaturahim, Kosolidasi Program','20000000.00','2026-08-22 00:00:00.000','2026-08-23 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(37,5,2026,'Coaching Perkaderan','Pokok',' Revitalisasi kader tangguh dan berdaya',NULL,'Para Instruktur Tingkat Daerah dan MPKSDI PDM PCM','Merefresh Kader dalam meningkatkan daya juang gerakan','Penguatan dan peningkatan komitmen instruktur perkaderan','Silaturahim, Kosolidasi Program','5000000.00','2026-02-07 00:00:00.000','2026-02-07 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(38,5,2026,'Kajian Kader ORTOM dan MPKSDI PCM se Kota Yogyakarta','Pokok',' Kosolidasi MPKSDI PDM dengan MPKSDI dan ORTOM PCM ',NULL,'MPKSDI PDM, PCM, dan ORTOM tingkat PCM','Untuk konsolidasi , kordinasi organisasi, penguatan kader ','Menggiatkan kader-kader yang ada di PCM','Kordinasi, pengumpulan data, pengolahan data, evaluasi','3200000.00','2026-04-05 00:00:00.000','2026-04-05 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(39,5,2026,'Kajian Kader Ranting','Pokok','Kunjungan Silaturahmi ke PRM se Kota terkait perkembangan Perkaderan ',NULL,'Jamaah PRM dan ORTOM','Silaturahim dan menggali kader di PRM','Menggali kader yang ada di ranting-ranting','Kordinasi, Evaluasi','2500000.00','2026-01-01 00:00:00.000','2026-10-31 00:00:00.000','14 Jan,15 April, 15 Juli, 14 Okt',1,4,'2026-04-15 16:23:00.000'),
(40,5,2026,'Koordinasi dengan ORTOM tingkat Daerah','Bantu','Koordinasi Kegiatan dan Perkaderan dengan ORTOM tingkat Daerah',NULL,'ORTOM Tingkat Daerah','Adnya sinergitas dalam melaksnakan program bersama','Meningkatkan sinergitas kegiatan bersama dan penguatan ortom','Tercipta kesepahaman kegiatan bersama','0.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(41,5,2026,'Koordinasi dengan Majlis dan Lembaga ','Bantu','Rapat Koordinasi terkait Kegiatan Bersama antara Majelis dan Lembaga',NULL,'Majelis dan Lembaga PDM','Terciptanya Komunikasi dan Kerjasama yang Baik antar Majelis dan Lembaga','Meningkatkan sinergitas kegiatan bersama program PDM','Tercipta kesepahaman kegiatan bersama','0.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(42,5,2026,'Data Base Kader','Pokok','Pengolahan data-data yang masuk MPKSDI melalui berbagai kegiatan',NULL,'Pimpinan PDM,PCM,PRM ORTOM dan AUM','MPKSDI, Majelis terkait dan PDM Kota dapat memiliki data base kader se kota Yogyakarta','Perencanaan dan pemeliharaan data kader yang profesional','Tersusunnya data kader yang lengkap dan akuntable','3000000.00','2026-01-01 00:00:00.000','2026-03-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(43,5,2026,'Raker MPKSDI','Pokok','Penguatan kesepahaman dalam menjalan gerak oragnisasi',NULL,'Anggota MPKSDI PDM Kota Yogyakarta','Adanya kesepahaman dan Kesolidan dalam melaksankan Program kerja','Menguatkan komitmen personil dan tugas-tugas organisisi','Memiliki komitmen bersam a dalam melaksnakan perkaderan di Kota Yogyakartaz','2500000.00','2026-01-31 00:00:00.000','2026-01-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(44,23,2026,'Pengelolaan Website PDM','Pokok','Persewaan Hosting website, Mengembangkan website PDM Kota Yogyakarta',NULL,'Semua kontributor berita','Mengaktifkan kembali website pdm sehingga bisa menyiarkan berita muhammadiyah khususnya di kota yogyakarta','Menawarkan dan koordinasi kepada seluruh masyarakat untuk menulis berita yang dimasukkan ke dalam website pdm','Aktif kembali website pdm dengan berita yang up to date','12000000.00','2026-01-01 00:00:00.000','2026-01-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(45,23,2026,'Pembuatan Majalah Matahari Bersinar, Sinar Surya, Srengenge, Hijau Berseri','Bantu','Menerbitkan majalah muhammadiyah \"Matahari Bersinar, Sinar Surya, Srengenge, Hijau Berseri\" tiap 3 bulan',NULL,'Semua elemen masyarakat','Majalah ini diterbitkan kembali untuk menumbuhkembangkan aktivitas media-watch di kalangan keluarga besar muhammadiyah dan melatih keterampilan komunikasi secara tertulis untuk menyampaikan opini, kritik dan ide.','Membuat rubrik-rubrik dalam majalah mentari yang informatif, edukatif dan menghibur','Terbitnya majalah mentari tiap 3 bulan','44000000.00','2026-03-01 00:00:00.000','2026-01-31 00:00:00.000','Maret, Juni, September, Desember',1,4,'2026-04-15 16:23:00.000'),
(46,23,2026,'Konten Media Sosial','Pokok','Membuat konten ramadhan, konten rutin bulanan dan konten insidental',NULL,'Para pengisi acara (narasumber dan host)','Memeriahkan ramadhan dan berdakwah','Membuat konten yang menarik dan bermanfaat','Konten terproduksi dengan baik','15000000.00','2026-01-01 00:00:00.000','2026-01-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(47,23,2026,'Buka Bersama Pengurus MPI','Bantu','Buka bersama untuk pengurus MPI',NULL,'Pengurus MPI','Buka bersama untuk koordinasi dan penguatan konsolidasi pengurus MPI',NULL,NULL,'1000000.00','2026-03-01 00:00:00.000','2026-03-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(48,23,2026,'Peningkatan kompetensi pustakawan','Pokok','Seminar, Diklat dan Pelatiahan',NULL,'Pengelola Perpustakaan Muhammadiyah Se Kota Yogyakarta','Peningkatan pengelolaan perpustakaan dan kompetensi pustakawan','Melaksanakan seminar, diklat dan pelatihan dengan tema tertentu','peserta bisa mendapatkan ilmu terkait dunia literasi dan perpustakaan','16000000.00','2026-05-01 00:00:00.000','2026-10-31 00:00:00.000','Mei dan Oktober',1,4,'2026-04-15 16:23:00.000'),
(49,23,2026,'Pelatihan Editing Video & Pengelolaan Website','Pokok','Memberikan pelatihan kejurnalisan bagi peserta',NULL,'Masyarakat Muhammadiyyah Kota Yogyakarta','Mengembangkan dan membangun sinergitas SDM, teknologi digital, literasi dan media yang terkonsolidasi dengan sistem gerakan maupun amal','Menghadirkan narasumber yang ahli di bidang jurnalis dan melakukan praktik','Adanya jurnalis-jurnalis muhammadiyah yang unggul, terintegrasi sehinga dapat meningkatkan kualitas dakwah muhammadiyah di segala zaman melalui jurnalis tersebut','16000000.00','2026-04-01 00:00:00.000','2026-09-30 00:00:00.000','April dan September',1,4,'2026-04-15 16:23:00.000'),
(50,23,2026,'Awwarding Konten','Pokok','Lomba membuat video reel untuk media sosial',NULL,'Sekolah, PCM dan PRM','Menumbuhkan semangat berinovasi dan berkompetisi positif untuk sekolah, PCM dan PRM','dibuat dua kategori : kategori AUM (Sekolah) dan Kategori PCM dan PRM','Terlaksana Lomba','10000000.00','2026-10-01 00:00:00.000','2026-10-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(51,23,2026,'Workshop Muhammadiyah School Branding','Pokok','Memberikan pembekalan bagaimana sekolah muhammadiyah dalam melakukan branding ditengah banyaknya bermunculan sekolah islam sehingga tidak kalah saing',NULL,'kepala sekolah, humas atau tim media','membantu sekolah muhammadiyah dalam menggali potensi internal untuk membuat strategi branding agar lebih dikenal masyarakat dan meningkatkan kepercayaan publik terhadap sekolah muhammadiyah','membuat workshop dengan dilengkapi tools branding','Konten sekolah atau lembaga muhammadiyah menjadi viral dan menarik publik','10000000.00','2026-01-01 00:00:00.000','2026-01-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(52,23,2026,'Pengadaan Alat Pembuatan Konten','Pokok','Kamera',NULL,NULL,'Alat penunjang kebutuhan konten','Membuat konten-konten yang menarik','Alat dapat digunakan dengan baik untuk membuat konten','12000000.00','2026-01-31 00:00:00.000','2026-01-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(53,23,2026,'Pelatihan Manajemen Reputasi Organisasi','Pokok','Melakukan pelatihan manajemen organisasi bagi PCM, Ortom, Majelis dan Lembaga',NULL,'PCM, Ortom, Majelis dan Lembaga','Memberikan pelatihan manajemen organisasi bagi PCM, Ortom, Majelis dan Lembaga','Menghadirkan Narasumber Ahli di Bidang Manajemen Organisasi','Masing-masing Organisasi memiliki Reputasi Manajemen yang baik','10000000.00','2026-07-01 00:00:00.000','2026-07-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(54,12,2026,'Adiwiyata Green School ','Wajib','Edukasi Green Shool Muhammadiyah. AUM SD,SMP,SMA/SMK Muhammadiyah yang belum terkait Adiwiyata Sekolah \"Green School\". Permen KLH : No 53 tahun 2019. Program Peduli Berbudaya Lingungan Hidup diSekolah ',NULL,'AUM yang belum Adiwiyata terkait dengan Permen KLH : No 53 Tahunn 2019','Menjadikan Sekolah Hijau Peduli Lingkungan,Sekolah ramah Lingkungan Nyaman,','Sosialisasi dan edukasi terkait Green Sekolah','perintisan terbentuknya sekolah muhammadiya yang peduli pada perilaku berbudaya Lingkungan ','5000000.00','2026-04-01 00:00:00.000','2026-05-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(55,12,2026,'Reresik Sungai dan gerakan Ekoriparian aksi Go Green ','Wajib',' \"Keep Surronding Clean\" Gerakan Reresik Sampah sungai\" dan Pemanfaatan sepadan Sungai dengan aksi gerakan Go Green',NULL,'Sungai winongo, code, gajah wong Gerakan Resik Sungai dengan \" Keep Surronding Clean\" Lingkungan Sungai sekitar bersih dari sampah\"','mengurangi sampah disungai, di sungai dan dapat Memanfaatan sepada sungai dengan Ketahanan pangan , ekosistem sungai berlangsung dengan baik ','Action melakukan Gerakan terjun ke sungai dengan reresik sampah yang ada. Dan penanaman tanaman ketahanan pangan terutama sayuran ','Air Sungai bersih ,Sampah yg ada disungai berkurang, daerah sekitar sepadan sungai dapat dimanfaatkan sebgai go green ketahanan pangan terutama sayur-sayuran ','7000000.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(56,12,2026,'Peringatan Hari Lingkungan Hidup 5 Juni 2026 ','Wajib','Keep Surronding Clean\"Kebersihan Lingkungan Sekitar Titik Nol dan Parkiran Bank Indonesia Lebih bersih dengan Gerakan Reresik Sampah .',NULL,'PCM,PRM,Majelis,, IMM, Ortom','Membagun Nilai Kesadaran dan mampu merubah perilaku 1) Aspek Motivasi, 2) Aspek Edukasi 3) Aspek Implimentatif pentingnya lingkungan sekitar bersih dari sampah','Action melakukan Gerakan reresik terjun ke lokasi titik 0 dan parkiran Bank Indonesia, menjadi lebih bersih, sehat, loingkiungan nyaman','Membangun nilaikesdaran perilaku terhadap lingkungan berubah. Mampu Lebih peduli pada kebersihan lingkungan sekitar, sebagau upaya melestarikan lingkungan yang lebih ramah','7000000.00','2026-06-01 00:00:00.000','2026-06-30 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(57,12,2026,'Merintis Kebun Da\"wah Turi Sleman','Bantu','Eco - Camp : Konsep Eco-Camp untuk 1) Edukasi , 2) camping /perkemahan, 3)perkebunan, 4)perikanan.\"Integrated farming\"',NULL,'HW, MLH, PDM, Majelis Ekonomi, Pemberdayaan masyarakat','Sebagai gerakan dawah lingkungan, Kesadaran lingkungan, sikap perilaku lingkungan, kepedulian sosial dan konservasi tempat edukasi camping, integrated farming','Strategi perencanaan,(tujuan program), Strategi Kegiatan (dakwah lingkungan), Strategi penguatan karakter, edukasi, managemen dan evaluasi. ','bertambahnya pengetahuan, ketrampilan terhadap lingkungan,dampak dan keberlanjutan.','10000000.00','2026-06-01 00:00:00.000','2026-12-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(58,12,2026,'Buku \"Menuju Perubahan\" MLH MLH PDM Kota','Wajib','Buku Laporan Kegiatan Majelis Lingkungan Hidup periode 2022-2025 Judul \"Kami sedang menuju Perubahan (We are heading towards change).',NULL,'Majelis Lingkungan Hidup PDM Kota Yogyakarta periode tahun 2022-2025','Mendokumentasikan kegiatan periode 2022-2025, bentuk pertanggungjawaban kepada pimpinan, menjadi sarana publikasi dan sosialisasi, memperkuat jejaring dan kerjasama, menginspirasi warga Muhammadiyah','perencanaan, dokumentasi, pelaksanaan penulisan, Evaluasi dan Finalisasi','Kelengkapan laporan, kejelasan dan kebenaran data pendukung, bahasa dan tata tulis, keterpaduan, ketepatan waktu penyusunan, manfaat buku laporan','7000000.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(59,12,2026,'Studi Tiru : Masjid Ramah Energi \" Panel solar\"','Bantu',' tindak lanjut dari \":Eco Masjid\" rencana kedepan upaya bijak dalam penggunaan energi terbarukan dengan pengembangan pemakaian listrik \"Panel Solar\". Rencana Lokasi Studi Tiru Di Masjid Supangat Tuban. Kerjasama dengan LPCR',NULL,'Masjid-Masjid Muhammadiyah,PRM, PCM,PDM, AUM','Bijak dalam penggunaan energi, air, hemat energi listrik, air ramah lingkungan dalam penggunaan energi dan air','Studi tiru, dan action','lebih bijak dalam penggunaan energi terutama listrik, air ramah lingkungan dalam penggunaan energi, efisiensi dan hemat dalam penggunaa energi, air','15000000.00','2026-10-01 00:00:00.000','2026-11-30 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(60,12,2026,'Shodaqoh Sampah','wajib','Gerakan Shodaqoh Sampah berbasis digital. Kolaborasi Lintas majelis Lazismu, Tabliq, Majelis Lingkungan Hidup PDM Kota Yogyakarta',NULL,'PDM, PCM,PRM , Warga Muhammadiyah','Membangun kepedul;ian lingkungan, mengintegrasikan nilai agama dan pelestarian lingkungan, meningkatkan ekonomi sampah, mengurangi sampah khususnya anorganik,edukasi dalam pengelolaan sampah anorganik ','Membentuk usaha Sodaqoh Sampah Bersama Lintas majelis. Sebagai alternatif kegiatan ekonomi untuk santunan anak yaitim, membantu bea siswa yg kuarang mampu, untuk kesehatan, kegiatan organisasi','Adanya pilot projek pengelolaaan gerakan Sodaqoh sampah yang dikelola lintas Majelis ','10000000.00','2026-01-01 00:00:00.000','2026-06-30 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(61,8,2026,'Pendampingan Kelas Bisnis Digital','Pokok','Melanjutkan Kelas Bisnis Digital',NULL,'SMP Muh Dasa','Kolaborasi marketplace','Menjalin kerjasama','Terlaksana','10000000.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(62,8,2026,'Rapat','Pokok','Rapat Koordinasi sebanyak 12 kali',NULL,'anggota MEBP','Koordinasi kegiatan-kegiatan yang ada di MEBP','Rapat di PDM dan rapat keliling','Terlaksana','5000000.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(63,20,2026,' Latihan Teater','Pokok','Menyelenggarakan Kegiatan Latihan Teater',NULL,'Latihan seminggu sekali untuk anak muda usia sekolah','Menyiapkan generasi muda Muhammadiyah menguasai dasar-dasar wawasan teater, baik keaktoran, penyutradaraan, tata artistik, manajemen produksi dan penulisan naskah','Menyelenggarakan latihan dengan menggunakan silabus yang terencana dan terukur','Terlaksananya kegiatan latihan secara teratur seminggu sekali dengan menggandeng (kerjasama) dengan Kelompok Teater Sastro Mbeling Yogyakarta sebagai mentor setiap pertemuan latihan.','5000000.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(64,20,2026,'Seni sastra dan tradisi','Pokok ','Pelatihan Penulisan dan Digitalisasi Aksara Jawa',NULL,'Pelajar Muhammadiyah dari jenjang SMP-SMA Warga Muhammadiyah di Kota Yogyakarta ','Mengenalkan sekaligus melestarikan warisan budaya berupa Aksara Jawa kepada seluruh warga Muhammadiyah agar dapat menjadi salah satu komponen yang dipertimbangkan agar font Aksara Jawa diakui oleh dunia',' Program ini bisa bekerja sama atau kolaborasi dengan Dinas Kebudayaan','Terlaksananya Pelatihan Penulisan dan digitalisasi aksara jawa','10000000.00','2026-04-01 00:00:00.000','2026-10-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(65,20,2026,'Heritage Muhammadiyah','Pokok','Inventarisasi Heritage Muhmmadiyah',NULL,'Heritage milik muhammadiyah di Kota Yogyakarta','Menghimpun keberadaan heritage muhammadiyah','Pendataan lapangan, dokumentasi, assessment heritage','Laporan inventarisasi tertulis tentang heritage muhammadiyah kota yogyakarta','5000000.00','2026-01-01 00:00:00.000','2026-07-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(66,20,2026,'Seni baca Al Quran','','MTQ PDM Kota Yogyakarta',NULL,'Qori-Qoriah AUM Kota Yogyakarta','a.	Menambah eksistensi Lembaga Seni di Bidang Tilawatil Qur’an di tengah masyarakat Kota Yogyakarta. b.	Sebagai wadah bagi qori-qoriah AUM Kota Yogyakarta untuk berkompetensi ditingkat provinsi','dilaksanakan bersamaan milad Muhammadiyah',NULL,'20000000.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(67,20,2026,'Fotografi','Bantu','Pelatihan jurnalistik',NULL,'Siswa AUM dari SMP-SMA','Pengembangan bakat dibidang jurnalistik','pelatihan terjadwal ','Pameran jurnalistik','6000000.00','2026-07-20 00:00:00.000','2026-07-20 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(68,20,2026,'Seni Rupa','','Pagelaran seni lukis',NULL,'Umum dan siswa AUM','pengembangan dan penghargaan terhadap seniman dibidang seni rupa','pendataan hasil karya seni rupa','pagelaran seni rupa','9000000.00','2026-07-01 00:00:00.000','2026-07-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(69,20,2026,'Seni Musik - Band PDM','Pokok','Membentuk Band Unggulan di PDM Kota Yogyakarta',NULL,'Pimpinan dan anggota ','Mewadahi dan mengembangkan potensi seni musik di kalangan PDM Kota Yogyakarta','Latihan rutin sepekan sekali','Terbentuknya Band Muda dan terlaksananya latihan rutin','8640000.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(70,20,2026,'Seni Musik - Orkestra & Paduan Suara PDM Kota Yogyakarta.','Pokok','Membentuk Orkestra & Paduan Suara PDM Yogyakarta yang mampu melaksanakan suatu pertunjukan / produksi musik dengan semangat syiar Muhammadiyah.',NULL,'Guru seni musik beserta siswa dan alumni sekolah / madrasah Muhammadiyah Kota Yogyakarta yang berbakat atau memliki keterampilan seni musik lingkup orkestra dan paduan suara (choir) serta kader Muhammadiyah yang berkompetensi seni musik. ','Membentuk Orkestra & Paduan Suara PDM Yogyakarta. ','(Persiapan, pendataan, penjaringan, pembinaan, pelatihan, pertunjukan)','Pertunjukan konser musik orkestra & paduan suara PDM Yogyakarta dalam rangka milad Muhammadiyah atau Festival Musik PDM Yogyakarta.','10000000.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(71,20,2026,'Penulisan kronik/sejarah lokal Muhammadiyah Kota Yogyakarta','Pokok','Lokakarya dan pendampingan penulisan kronik/sejarah lokal Muhammadiyah berbasis cabang dan ranting di Kota Yogyakarta',NULL,'Cabang dan ranting se-Kota Yogyakarta','Mendokumentasikan data dan fakta sejarah serta kiprah Muhammadiyah untuk masyarakat di Kota Yogyakarta sebagai Ibu Tempat Persyarikatan Muhammadiyah','Lokakarya dan pendampingan','Terbitnya buku antologi tulisan sejarah cabang dan ranting Muhammadiyah di Kota Yogyakarta','10000000.00','2026-01-01 00:00:00.000','2026-06-30 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(72,15,2026,'Monitoring penyusunan RKAS T.A. 2026','Pokok','1. Penyempurnaan digitalisasi aplikasi RKAS; 2. Mengadakan workshop dan sosialisasi aplikasi RKAS; 3. Melakukan pendampingan pembuatan RKAS; 4. Menerima presentasi RKAS',NULL,'36 SD dan 12 SMP/MTs Muhammadiyah','1. Tersedianya aplikasi RKAS yang terdigitalisasi dan akuntabel; 2. Tersedianya RKAS dari seluruh sekolah sebagai rujukan kegiatan dan penganggaran sekolah tersebut','1. Pelatihan dan workshop; 2. Pendampingan ke AUM; 3. Monitoring dan evaluasi penyusunan RKAS','1. Terlaksananya presentasi RKAS T.A. 2026; 2. RKAS seluruh SD dan SMP/MTs Muhammadiyah se Kota Yogyakarta; ','60000000.00','2026-01-01 00:00:00.000','2026-01-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(73,15,2026,'Refreshing dan Pelatihan Perpajakan','Pokok','1. Pelatihan pelaporan perpajakan sesuai ketentuan terbaru; 2. Workshop/pelatihan mengenai aturan perpajakan terbaru',NULL,'Kepala dan Bendahara SD dan SMP/MTs Muhammadiyah, Pimpinan PDM, Ketua Majelis dan Lembaga PDM','1. Memberikan pemahaman tenatng pentingnya pelaporan pajak; 2. Tersampaikannya tata cara dan atau aturan perpajakan sesuai dengan aturan yang berlaku','Pelatihan dan atau workshop dengan mendatangkan pemateri praktisi di bidang perpajakan','1. Terlaksananya pelatihan; 2. 35% AUM mengaplikasikan hasil pelatihan','20000000.00','2026-03-01 00:00:00.000','2026-03-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(74,15,2026,'Pendampingan dan Pembinaan AUM','Pokok','1. Membentuk tim pendampingan dan pembinaan; 2. Melakukan pendampingan dan pembinaan rutin ke AUM',NULL,'36 SDM dan 12 SMP/MTs Muhammadiyah','1. Terciptanya hubungan yang baik antara LPPK dan AUM; 2. Monitoring pelaksanaan Tata Kelola Keuangan di AUM','1. Terciptanya Tata Kelola Keuangan yang baik dari AUM; 2. Pelaporan keuangan yang transparan dan akuntabel dari AUM','1. Kunjungan tim pendamping yang dilakukan setiap 3 bulan sekali; 2. Tim pendamping melakukan pendampingan dan mengisi form monev yang ada dalam buku pendampingan AUM','10000000.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(75,15,2026,'Pelaksanaan Mandat Audit PDM, Majelis Lembaga, AUM, dan BUMM','Pokok','Melaksanakan mandat khusus yang diberikan PDM untuk melakukan pengawasan keuangan persyarikatan, AUM, dan BUMM dalam kondisi tertentu',NULL,'Semua komponen persyarikatan, AUM, dan BUMM yang berada dalam lingkup PDM Kota Yogyakarta','Pengawasan sistem pengelolaan keuangan dalam lingkup PDM Kota Yogyakarta berjalan dengan baik, akuntabel, dan transparan','1. Melakukan pembinaan dan pengawasan sesuai dengan mandat yang diberikan; 2. Melakukan pelaporan hasil audit kepada stakeholder terkait','Terbit rekomendasi atas hasil audit','15000000.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(76,15,2026,'Penyesuaian SOP Keuangan PDM Kota Yogyakarta','Pendukung','Membentuk tim ad hoc SOP Keuangan',NULL,'Anggota LPPK PDM','1. Monitoring dan evaluasi pelaksanaan SOP Keuangan PDM Kota Yogyakarta yang telah dimiliki; 2. Penyesuaian SOP Keuangan PDM Kota Yogyakarta sesuai dengan kondisi terkini; 3. Tersedianya SOP Keuangan PDM Kota Yogyakarta yang bisa digunakan oleh semua pihak di lingkup PDM Kota Yogyakarta','Penyesuaian seluruh SOP Keuangan yang dimiliki PDM Kota Yogyakarta','1. Terbit hasil monitoring dan evaluasi pelaksanaan SOP Keuangan PDM Kota Yogyakarta; 2. Penyesuaian SOP Keuangan PDM Kota Yogyakarta','10000000.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(77,15,2026,'Edukasi, Pembinaan, dan Digitalisasi Aktivitas Keuangan','Pendukung','1. Melakukan pelatihan dan atau workshop Tata Kelola Keuangan Organisasi; 2. Pembuatan aplikasi pelaporan keuangan; 3. Digitalisasi aktivitas keuangan dalam lingkup PDM Kota Yogyakarta',NULL,'PDM, UP PDM, Ortom, PCM, Takmir, dan AUM','1. Terciptanya tata kelola keuangan organisasi yang baik di lingkup PDM Kota Yogyakarta; 2. Pelayanan keuangan di lingkup PDM Kota Yogyakarta yang lebih sistematis, efektif, dan akuntabel','1. Pelatihan Tata Kelola Keuangan dan Lembaga Bendahara AUM dan Takmir Masjid Muhammadiyah se Kota Yogyakarta; 2. Pembuatan aplikasi sistem aktifitas keuangan untuk PCM berbasis digital','1. Terlaksananya pelatihan; 2. Terciptanya Sistem aktifitas keuangan berbasis digital dan Sistem Pengajuan Anggaran PDM Kota Yogyakarta','15000000.00','2026-08-01 00:00:00.000','2026-08-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(78,15,2026,'Studi Tiru Pelaksanaan Tata Kelola Keuangan AUM','Pokok','Kunjungan ke PCM Gombong dan AUM yang dimiliki',NULL,'Anggota LPPK, Bendahara, dan Wakil Bendahara PDM','1. Mendapatkan informasi yang memadai mengenai Tata Kelola Keuangan AUM; 2. Menemukan langkah unik dan inspiratif dalam pelaksanaan Tata Kelola Keuangan AUM; 3. Memahami pola pembinaan dan pengawasan keuangan AUM','1. Silaturahmi dengan PCM Gombong; 2. Mendatangi AUM PCM Gombong dengan Tata Kelola Keuangan yang baik; 3. Mencermati dan mempelajari Tata Kelola Keuangan AUM','1. Terlaksananya kunjungan; 2. Mind Map pedoman Tata Kelola Keuangan','15000000.00','2026-10-01 00:00:00.000','2026-10-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(79,16,2026,'Rapat Kerja - Lembaga Resiliensi Bencana','Pokok','Koordinasi organisasi terkait dengan perencanaan pelaksanaan Program Kerja 2026',NULL,'Internal LRB PDM Jogja','Sinergitas pelaksanaan program di Internal LRB PDM Kota Jogja agar sesuai dengan visi LRB Periode 2022-2027','Outing dan Diskusi','Munculnya Matriks Program Kerja LRB 2024 dan Program Kerja LRB hingga 2027','1500000.00','2026-12-01 00:00:00.000','2026-12-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(80,16,2026,'Posko MudikMu 2026','Pokok','Menyiapkan layanan bantuan bagi para Pemudik Lebaran 2026 dengan layanan Kesehatan, Rest Area, dan Otomotif',NULL,'Masyarakat Umum yang melintasi Kota Yogyakarta','Memberikan Pelayanan Posko bagi para Pemudik Lebaran 2026','Perumusan, Pembahasan, dan Sosialiasai','Terlaksananya Posko MudikMu Kota Yogyakarta pada lebaran 2026','25000000.00','2026-02-01 00:00:00.000','2026-03-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(81,16,2026,'Pembuatan SOP Administrasi','Bantu','SOP ini disusun untuk menjadi panduan internal LRB PDM Jogja dalam berkegiatan',NULL,'Internal LRB PDM Jogja','Agar segala administrasi kegiatan LRB dapat terarsip dengan rapi','Perumusan, Pembahasan, dan Sosialiasai','Terbitnya SOP Administrasi LRB PDM Jogja','300000.00','2026-01-01 00:00:00.000','2026-01-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(82,16,2026,'Pembuatan SOP Keuangan meliputi - Penyusunan Anggaran Kegiatan, Cash Flow Keuangan Organisasi, Kerjasama/Sponsorship dll untuk kegiatan LRB PDM Kota Yogyakarta','Bantu','SOP ini disusun untuk menjadi panduan internal organisasi yang terinspirasi dari kegiatan LRB yang sudah dilakukan',NULL,'Internal LRB PDM Jogja','Agar tercapainya transparansi dan akuntabilitas manajemen keuangan LRB PDM Kota Yogyakarta','Perumusan, Pembahasan, dan Sosialiasai','Terbitnya SOP Keuangan LRB PDM Jogja','300000.00','2026-01-01 00:00:00.000','2026-01-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(83,16,2026,'Rekapitulasi Keuangan bulanan','Bantu','Kegiatan ini merupakan bentuk publikasi update keuangan LRB PDM Jogja secara bulanan',NULL,'Internal LRB PDM Jogja','Agar tercapainya transparansi dan akuntabilitas manajemen keuangan LRB PDM Kota Yogyakarta','Penyusunan Format Keuangan, dan file spreadsheet update keuangan LRB PDM Jogja','Terbitnya laporan bulanan keuangan LRB PDM Jogja','1200000.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','Setiap Bulan selama 2026',1,4,'2026-04-15 16:23:00.000'),
(84,16,2026,'Workshop manajemen relawan, logistik, dan peralatan Forum Relawan Muhammadiyah Kota Yogyakarta','Pokok','FRB PDM Kota Yogyakarta sebagai wadah relawan pengurangan risiko bencana dengan tujuan pembentukan Jamah Tangguh OMOR (One Muhammadiyah One Resilience) PDM Kota Yogyakarta',NULL,'FRB PDM Kota Yogyakarta','Mewujudkan Jamah Tangguh OMOR (One Muhammadiyah One Resilience) PDM Kota Yogyakarta','LRB PDM Kota Yogyakarta bekerja sama dengan ADDMC UAD','Terselenggaranya kegiatan workshop','2500000.00','2026-08-01 00:00:00.000','2026-08-14 00:00:00.000','Pekan 1-2 Agustus 2026',1,4,'2026-04-15 16:23:00.000'),
(85,16,2026,'Jamaah Tangguh - Gladi-Simulasi dan latihan gabungan Forum Relawan Muhammadiyah Kota Yogyakarta','Pokok','Kegiatan bersama FRB PDM Kota Yogyakarta dengan inti acara simulasi bencana (dikhususkan pada bencana gempa)',NULL,'FRB PDM Kota Yogyakarta','Mewujudkan Jamah Tangguh Siaga Bencana Gempabumi','LRB PDM Kota Yogyakarta bekerja sama dengan ADDMC UAD, BPBD Kota Yogyakarta, dan BPBD DIY','Terselenggaranya kegiatan simulasi','4500000.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','4 Bulan Sekali',1,4,'2026-04-15 16:23:00.000'),
(86,16,2026,'Pengadministrasian Pergudangan','Pokok','Kerja bakti',NULL,'Internal LRB PDM Jogja','Pendataan dan pencatatan barang masuk / keluar','Pencataan semua kegiatan dalam pergudangan','Tertib Adminstrasi','5000000.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(87,16,2026,'Penyimpanan Alat','Pokok','Database inventaris peralatan',NULL,'Internal LRB PDM Jogja','Semua alat tertata dan mudah untuk diambil','Menata alat sesuai dengan kebutuhan sehinggal mudah untuk diambil','Alat tertata rapi','1000000.00','2026-04-01 00:00:00.000','2026-04-30 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(88,16,2026,'Pemeliharaan dan pengendalian kualitas alat','Pokok','Cek kondisi peralatan dan logistik dan cek inventarisir peralatan dan logistik',NULL,'Internal LRB PDM Jogja','Melakukan perawatan dan pemeliharaan alat sesuai dengan fungsi alat','Melakukan perawatan berkala sesuai fungsi alat','Alat mudah digunakan dan aman dalam penggunaannya','1000000.00','2026-05-01 00:00:00.000','2026-05-30 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(89,16,2026,'Pengadaan barang / alat sesuai kebutuhan bidang lain','Pokok','Belanja Alat dan Kerja bakti',NULL,'Internal LRB PDM Jogja','Membuat Proposal pengadaan barang / alat sesuai dengan pengajuan barang / alat dari bidang lain','Merekapitulasi permohonan barang / alat dari bidang lain dan membuat proposal pengadaan barang /alat','Kelancaran dalam melakukan kegiatan','3000000.00','2026-02-01 00:00:00.000','2026-02-28 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(90,16,2026,'Pembentukan SOP Tim Reaks Call pat (On Call)','Bantu','Dalam Kegiatan ini akan dibentuk Tim Yang siap ditugaskan apa bila terjadi Emergency dan pemahaman tugas dan fungsi sebagai tim yang siap ditugaskan',NULL,'Internal LRB PDM Jogja','Kesiapan LRB PDM Kota Yogyakarta sudah siap mengirim kan personil','FGD (Forum Group Discussion)','Terbentuknya Tim','5000000.00','2026-01-01 00:00:00.000','2026-01-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(91,16,2026,'Pelatihan Penggunaan Alat Kebencanaan','Bantu','Dalam Pelatihan ini peserta akan dikenalkan dengan alat alat kebencanaan dan diajarkan cara menggunakan, marawat, dan memperbaiki apa bila terjadi kerusakan',NULL,'Internal LRB PDM Jogja dan Forum Relawan Muhammadiyah Jogja','Peningkatan skill anggota dalam menggunakan dan merawat peralatan yang dimiliki','Teori + Praktek','Semua Bisa','8000000.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','4 Bulan Sekali selama 2026',1,4,'2026-04-15 16:23:00.000'),
(92,16,2026,'TOF SPAB','Pokok','FRB PDM Kota Yogyakarta sebagai wadah relawan pengurangan risiko bencana dengan tujuan pembentukan Jamah Tangguh OMOR (One Muhammadiyah One Resilience) PDM Kota Yogyakarta',NULL,'FRB PDM Kota Yogyakarta','Mewujudkan Jama\'ah Tangguh OMOR (One Muhammadiyah One Resilience) PDM Kota Yogyakarta','LRB PDM Kota Yogyakarta bekerja sama dengan ADDMC UAD','Terselenggaranya kegiatan SPAB sebanyak 5 sekolah','25000000.00','2026-06-01 00:00:00.000','2026-06-30 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(93,16,2026,'SPAB','Pokok','Kegiatan dengan mengajarkan pentingnya Pengurangan Resiko Bencana di sekolah, dan mempersiapkan kesiapsiagaan warga sekolah dalam menghadapi Bencana',NULL,'Warga sekolah (Guru, Siswa, Karyawan dan Komite Sekolah)','Mempersiapkan warga sekolah dalam menghadapi kegiatan kedaruratan','Pelatihan dan pembentukan','Dilakukan pertemuan 6x Selama 2026','60000000.00','2026-03-01 00:00:00.000','2026-12-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(94,16,2026,'Dana Taktis Kebencanaan','Pokok','Alokasi Dana Siap Akses untuk Kesiapsiagaan',NULL,'Masyarakat Umum','Mempersiapkan Peralatan dan SDM untuk Tanggap Darurat','Tanggap Darurat','Dianggarkan 6 kali minimal dalam satu tahun','18000000.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','Setiap Waktu',1,4,'2026-04-15 16:23:00.000'),
(95,16,2026,'Pertemuan ke-2 PRM, PCM, dan ORTOM untuk pelatihan kebencanaan','Pokok','Pelatihan Kebencanaan',NULL,'PRM PCM ORTOM','Melatih Kesiapsiagaan terhadap bencana','Pertemuan dan Pelatihan','50 Relawan terlatih','5000000.00','2026-01-01 00:00:00.000','2026-01-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(96,13,2026,'Konsolidasi LPP dengan Sekolah MBS dan Pondok Pesantren','Pokok','Koordinasi dan konsolidasi antara LPP dengan sekolah yang memiliki MBS serta Pondok Pesantren dalam rangka penyelarasan program pembinaan dan tahfidz',NULL,'Sekolah Muhammadiyah yang memiliki MBS dan seluruh Pondok Pesantren di lingkungan PDM Kota Yogyakarta.','Menyatukan persepsi dan kebijakan antara LPP dengan sekolah MBS dan Pondok Pesantren.Menguatkan sinergi pembinaan pesantren dan program tahfidz di lingkungan Muhammadiyah.','Melaksanakan forum koordinasi dan konsolidasi secara terjadwal.Melibatkan pimpinan sekolah/pesantren dan unsur LPP dalam perumusan kesepakatan program.Menyusun rencana tindak lanjut hasil konsolidasi secara tertulis.','Terlaksananya pertemuan konsolidasi dan adanya kesepakatan program kerja bersama','15000000.00','2026-02-01 00:00:00.000','2026-02-28 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(97,13,2026,'Kunjungan Tim LPP ke Sekolah MBS dan Pondok Pesantren','Pokok','Kunjungan lapangan Tim LPP ke sekolah yang memiliki MBS dan seluruh Pondok Pesantren untuk pemetaan kondisi, kebutuhan, dan pendampingan',NULL,'Sekolah Muhammadiyah yang memiliki MBS dan Pondok Pesantren binaan LPP PDM Kota Yogyakarta.','Memetakan kondisi kelembagaan, program tahfidz, dan kebutuhan pembinaan sekolah MBS dan Pondok Pesantren. Menjadi dasar perencanaan program pendampingan LPP secara berkelanjutan.','Melakukan kunjungan lapangan secara bertahap dan terjadwal. Melaksanakan observasi, dialog, dan pengumpulan data di setiap sekolah/pesantren. Menyusun laporan hasil kunjungan sebagai basis database LPP.','Tersusunnya laporan hasil kunjungan dan data sekolah/pesantren binaan','20000000.00','2026-05-01 00:00:00.000','2026-05-30 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(98,13,2026,'Sosialisasi Persiapan Verifikasi Wisuda Tahfidz','Pokok','Sosialisasi kepada sekolah MBS dan Pondok Pesantren terkait mekanisme, standar, dan persiapan verifikasi wisuda tahfidz',NULL,'Sekolah Muhammadiyah Se- Kota Yogyakarta.','Memberikan pemahaman yang seragam terkait mekanisme dan standar verifikasi wisuda tahfidz. Meningkatkan kesiapan sekolah dan pesantren dalam mengikuti proses verifikasi.','Menyelenggarakan kegiatan sosialisasi secara terpusat atau daring/luring. Menyampaikan pedoman teknis dan instrumen verifikasi secara jelas dan terstruktur. Memberikan ruang diskusi dan klarifikasi kepada peserta.','Peserta memahami alur, syarat, dan teknis verifikasi wisuda tahfidz','15000000.00','2026-08-01 00:00:00.000','2026-08-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(99,13,2026,'Verifikasi Wisuda Tahfidz','Pokok','Pelaksanaan verifikasi hafalan peserta wisuda tahfidz sesuai standar yang ditetapkan LPP',NULL,'Sekolah Muhammadiyah Se- Kota Yogyakarta.','Menjamin mutu dan validitas hafalan peserta wisuda tahfidz. Menjaga standar kualitas lulusan tahfidz di lingkungan Muhammadiyah.','Membentuk tim verifikator tahfidz yang kompeten dan berintegritas.Melaksanakan verifikasi sesuai standar dan instrumen yang telah ditetapkan. Mendokumentasikan hasil verifikasi sebagai arsip dan dasar penetapan peserta wisuda.','Terselenggaranya verifikasi dan tersusunnya daftar peserta yang lolos verifikasi','20000000.00','2026-11-01 00:00:00.000','2026-11-30 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(100,22,2026,'Channeling kegiatan LPHU, KBIHU, SCM Kota, dengan WEB PDM Kota','Pokok','Menyiapkan akun dan mengembangkan konten, hosting dan domain',NULL,'Jamaah, persyarikatan dan masyarakat umum','Membangun citra positif KBIHU di dunia maya','Melibatkan komunitas mahasiswa','Web dan sosmed terbangun','10000000.00','2026-02-01 00:00:00.000','2026-03-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(101,22,2026,'Perumusan Proses Bisnis Layanan Bimibingan Haji dan Umrah','Pokok','Pembuatan dokumen ProBis dan prototype aplikasi pendaftaran jamaah berbasis andorid',NULL,'LPHU, KBIHU Aisyiyah Kota, SCM Kota','Digitalisasi layanan dan basis data jamaah','Melibatkan komunitas mahasiswa','Dokumen ProBis dan protptype aplikasi terwujud','5000000.00','2026-03-01 00:00:00.000','2026-04-30 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(102,22,2026,'Updating Buku Ajar Ibadah Haji & Umrah ','Pokok','Mendukung kebutuhan KBIHU Aisyiyah Jogja',NULL,'LPHU, KBIHU Aisyiyah Kota','Menyempurnakan buku yang sudah ada','Lokakarya & Pencetakan','BUKU TUNTUNAN IBADAH HAJI & UMROH terupdate','7500000.00','2026-08-01 00:00:00.000','2026-08-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(103,22,2026,'Menerbitkan materi bimbingan haji umrah dalam format video online','Pokok','Mendukung kebutuhan KBIHU Aisyiyah Jogja',NULL,'Jamaah haji dan umroh','Memudahkan jamaah dalam mempelajari dan menguasai materi bimbingan haji dan umroh','Outsourching ke vendor (TV kampus, komunitas mhs dll)','Materi bimbingan terbit dalam format video online, mudah diakses oleh jamaah','10000000.00','2026-09-01 00:00:00.000','2026-12-31 00:00:00.000','Take video, Video Editing, Publishing',1,4,'2026-04-15 16:23:00.000'),
(104,22,2026,'Sosialisasi Buku Ajar Ibadah Haji & Umrah','Pokok','Bermitra dengan KBIHU Aisyiyah  Kota & SCM Kota ',NULL,'Jamaah Haji 2026','Menjaga pelaksanaan ibadah haji sesuai syariat','Mendukung Proker KBIHU Aisyoyah Kota','Jamaah haji dan umroh menerima buku oanduan edisi 2024','2000000.00','2026-09-01 00:00:00.000','2026-12-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(105,22,2026,'Benchmarking ke LPHU Daerah/Wilayah lain','Pokok','Menyesuaikan jadwal LPHU sasaran',NULL,'LPHU PP / PDM lain','penguatan ukhuwah dan koordinasi antar lembaga','Mendukung Proker KBIHU Aisyoyah Kota','Terjalin silaturahmi','2500000.00','2026-04-01 00:00:00.000','2026-04-01 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(106,22,2026,'Mendampingi Penyusunan silabus pra manasik, manasik klasikal, & manasik regu','Pokok','Workshop, FGD berama LPHU PWM DIY',NULL,'BPH KBIHU Aisyiyah DIY, KBIHU Aisyiyah','PENYAMAAN SILABUS MANASIK HAJI DAN UMROH','Mendukung Proker KBIHU Aisyoyah Kota','Silabus terupdate','2000000.00','2026-05-01 00:00:00.000','2026-07-31 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(107,22,2026,'Monitoring pelaksanaan Haji & Umrah 2026','Pokok','Bermitra dengan KBIHU Aisyiyah  Kota & SCM Kota, Petugas Haji',NULL,'Jamaah Haji 2025','mengetahui dan memantau proses pelaksanaan haji dan umroh dan membantu solusi bila diperlukan','Mendukung Proker KBIHU Aisyoyah Kota','Teridentifikasinya problematika haji terkait pembimbingan manasik.','2000000.00','2026-05-01 00:00:00.000','2026-08-31 00:00:00.000','Musim haji 2026',1,4,'2026-04-15 16:23:00.000'),
(108,22,2026,'Melakukan evaluasi pelaksanaan Haji dan Umrah 2025','Pokok','Bermitra dengan KBIHU Aisyiyah  Kota & SCM Kota, Petugas Haji',NULL,'Jamaah Haji & Umroh 2025','perbaikan pelaksanaan dan pelayanan haji baik oleh pemerintah maupun pengurus KBIHU','Mendukung Proker KBIHU Aisyoyah Kota','Tersusun skenario update materi bimbingan untuk than berikutnya','1500000.00','2026-05-01 00:00:00.000','2026-08-31 00:00:00.000','Juli/agustus 2026, memyesuaiakn jadwal haji',1,4,'2026-04-15 16:23:00.000'),
(109,22,2026,'Pembuatan jasket seragam ','Pokok','Bermitra dengan vendor dan sponsor (11 x Rp. 500.000 = Rp 5.500.000)',NULL,'Branding kelembagaan',NULL,NULL,NULL,'5500000.00','2026-02-01 00:00:00.000','2026-02-01 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(110,22,2026,'Penyelenggaraan Mudzakaroh ','Pokok','Bermitra dengan LPHU PWM DIY, KBIHU Aisyiyah dan SCM',NULL,'Pengurus LPHU PDM Kota','Persiapan untuk musim haji 2025','Mendukung Proker KBIHU Aisyoyah Kota','Pemantapan pembimbing & sinkronisasi materi bimbingan','20000000.00','2026-11-01 00:00:00.000','2026-11-01 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(111,22,2026,'Sinkronisasi Proker dengan KBIHU Kota Jogja','Pokok','Workshop bersama KBIHU Kota Jogja',NULL,'Proker KBIHU Kota Jogja','Sinkronisasi proker','Implementasi Supply Chain Management','Proker tersinkronisasi','1000000.00','2026-02-15 00:00:00.000','2026-02-15 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(112,14,2026,'Rapat Koordinasi ','Pokok','Pertemuan rutin',NULL,'Anggota LPCRPM','Update informasi dan rencana pelaksanaan kegiatan','Setiap anggota menyampaikan usul dan saran','Dihadiri anggota LPCRPM','0.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','2 pekan sekali minggu 1 dan ke-3 Akomodasi disiapkan Sekretariat PDM',1,4,'2026-04-15 16:23:00.000'),
(113,14,2026,'Studi Tiru LPCRPM PDM Yogya ke PCM Gombong, Kebumen','Pokok','Studi Tiru ke PCM Unggul',NULL,'Anggota LPCRPM','Sharing program dan kegiatan unggul PCM','PCM Gombong','Terlaksananya kegiatan pada Bulan Januari 2025','26500000.00','2026-01-01 00:00:00.000','2026-01-07 00:00:00.000','Pekan ke-1 Januari 2026 Menunggu perhitungan bendahara PDM dan EO ',1,4,'2026-04-15 16:23:00.000'),
(114,14,2026,'Studi Tiru LPCRPM PDM Yogya ke PRM Gading, Klaten','Pokok','Studi Tiru ke PRM Unggul',NULL,'Anggota LPCRPM','Sharing program dan kegiatan unggul PRM','PRM Gading, Klaten','Terlaksananya kegiatan pada Bulan Januari 2025','10500000.00','2026-01-01 00:00:00.000','2026-01-21 00:00:00.000','Pekan ke-3 Januari 2026 Menunggu perhitungan bendahara PDM dan EO ',1,4,'2026-04-15 16:23:00.000'),
(115,14,2026,'Studi Tiru LPCRPM PDM Yogya ke Masjid Unggul (darussalam Wonosobo)','Pokok','Studi Tiru ke PRM Unggul',NULL,'Anggota LPCRPM','Sharing program dan kegiatan unggul PRM','Masjid Darussalam Wonosobo','Terlaksananya kegiatan pada Bulan Januari 2025','26500000.00','2026-01-01 00:00:00.000','2026-01-21 00:00:00.000','Pekan ke-3 Januari 2026 Menunggu perhitungan bendahara PDM dan EO ',1,4,'2026-04-15 16:23:00.000'),
(116,14,2026,'Sosialisasi aplikasi SICARA (Sistem Informasi Cabang Ranting)','Bantu','Pengenalan  APLIKASI SICARA',NULL,'Anggota LPCRPM-Cabang-Ranting','Terupdatenya data riil aplikasi SICARA ranting-cabang-daerah','Bekerjasama dengan LPPM UAD dan LPCRPM PWM DIY','Memahami aplikasi SICARA, Dapat menginput data kegiatan di ranting-cabang-daerah, dan Terupdatenya data SICARA real time','8000000.00','2026-02-15 00:00:00.000','2026-02-15 00:00:00.000','',1,4,'2026-04-15 16:23:00.000'),
(117,14,2026,'Melaksanakan Program LPCRPM PWM DIY','Bantu','Rakor rutin, Penilaian CRM Unggul',NULL,'LPCRPM PDM','Koordinasi program kerja','Rakor bersama','Terlaksananya kegiatan/Rakor','3000000.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','3 bulan sekali 4 kali dalam setahun',1,4,'2026-04-15 16:23:00.000'),
(118,14,2026,'Pendampingan intensif 2 masjid zona merah','Pokok',NULL,NULL,NULL,NULL,'Masjid Darussalam dan ArRohmah, PCM Ngampilan',NULL,'5000000.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','Tentatif',1,4,'2026-04-15 16:23:00.000'),
(119,14,2026,'Pendampingan intensif masjid Unggulan PDM Kota Yogyakarta ','Pokok',NULL,NULL,NULL,NULL,'Masjid  Al Irsyad Mergangsan',NULL,'5000000.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','Tentatif',1,4,'2026-04-15 16:23:00.000'),
(120,14,2026,'Pendampingan intensif Cabang Unggulan PDM Kota Yogyakarta ','',NULL,NULL,NULL,NULL,'PCM Kotagede',NULL,'5000000.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','Tentatif',1,4,'2026-04-15 16:23:00.000'),
(121,3,2026,'Koordinasi dan Evaluasi Kegiatan','Pokok ','1. Rapat Rutin',NULL,'Pemerhati Majelis Tabligh dan Anggota Majelis Tabligh','Mengkoordinasikan dan mengevaluasi kegiatan. ','Diskusi dan musyawarah.','Rapat terlaksana dan hasil-hasilnya ','600000.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','sebulan sekali. Konsumsi : 5.000 x 10 orang x 12 = 600.000,-',1,4,'2026-04-15 16:23:00.000'),
(122,3,2026,'Koordinasi dan Evaluasi Kegiatan','Bantu','2. Silaturrahmi dan Upgrading Majelis Tabligh dan Korps Muballigh Muhammadiyah se-Kota Yk',NULL,'Majelis Tabligh dan KMM PCM se-Kota Yk','Koordinasi dan evaluasi kegiatan dakwah','Diskusi dan musyawarah.','Kegiatan terlaksana ','4300000.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','Setahun sekali, konsumsi : 80 orang x (15.000 + 20.000) = 2.800.000; narasumber: 3 orang x 500.000 = Rp 1.500.000; Jumlah: Rp 4.300.000',1,4,'2026-04-15 16:23:00.000'),
(123,3,2026,'Peningkatan Mutu Organisasi','Pokok ','3. Layanan Mubaligh Jaga (LMJ) ',NULL,'Seluruh warga persyarikatan (PDM, PCM, PRM, Ortom, AUM, Masjid beserta Takmir dan Jama\'ahnya)','Memenuhi kebutuhan ketersediaan  muballigh bagi  masyarakat (terjadwal dan insidentil). ','Membentuk Grup WA KMM dan mensosialisasikan program LMJ melalui WA dan forum tertentu.','Survey Kepuasan Publik terhadap Layanan KMM','120000.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','Setiap waktu / hari, honorarium admin KMM Kota Yk: 12 Bln x 10.000 = 120.000',1,4,'2026-04-15 16:23:00.000'),
(124,3,2026,'Peningkatan Mutu Organisasi','Bantu','4. Pelatihan Korps Muballigh Muhammadiyah (Khatib dan Imam Masjid : Dauroh Khithobah wal Imaamah dan Pembentukan Divisi Jam\'iyah al-Qurra\' wa al-Huffadh Muhammadiyah)',NULL,'Korps Muballigh Muhammadiyah (KMM) dan Korps Muballighot Aisyiyah se-Kota Yk','Terbentuknya KMM dan KMA sesuai standar Ketentuan KMM Pusat.','Bimbingan dan kursus, praktik, dan tindak lanjut.','Kegiatan dan evaluasi terlaksana ','26000000.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','Setahun sekali, konsumsi : 80 orang x 2 hari x (4 x snack : 15.000) + (4 x makan siang : 20.000) = 22.400.000; narasumber: 6 orang x 300.000 = Rp 3.600.000; Jumlah: Rp 26.000.000',1,4,'2026-04-15 16:23:00.000'),
(125,3,2026,'Pelayanan Dakwah Komunitas','Pokok ','5. Pembinaan di LP Wirogunan (setiap Hari Kamis)',NULL,'Seluruh warga persyarikatan (PDM, PCM, PRM, Ortom, AUM, Masjid beserta Takmir dan Jama\'ahnya)','Memenuhi kebutuhan ketersediaan  muballigh bagi  masyarakat (terjadwal dan insidentil). ','Ceramah (Kajian Aqidah, Akhlak, dan Muamalah) ','Kegiatan terlaksana ','9600000.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','Setiap Hari Kamis, Honorarium: (4 pekan x 12 Bln) x 200.000 = 4.800.000 ',1,4,'2026-04-15 16:23:00.000'),
(126,3,2026,'Pelayanan Dakwah Komunitas','Pokok ','6. Pembinaan di Rutan Wirogunan (setiap hari Senin) ',NULL,'Pegawai dan Warga Binaan ','Meningkatkan Iman & Taqwa serta Akhlak. ','Ceramah (Kajian Aqidah, Akhlak, dan Muamalah) ','Kegiatan terlaksana ','9600000.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','Setiap Hari Senin, Honorarium: (4 pekan x 12 Bln) x 200.000 = 4.800.000 ',1,4,'2026-04-15 16:23:00.000'),
(127,3,2026,'Pelayanan Dakwah Komunitas','Pokok ','7. Kajian Tajwid dan Tilawah Qur\'an di LP Wirogunan (setiap Hari Selasa dan Rabu) ',NULL,'Pegawai dan Warga Binaan ','Meningkatkan kemampuan Membaca dan melafadzkan Qur\'an sesuai kaidah Tajwid.','Pembelajaran (klasikal dan privat) ','Kegiatan terlaksana ','9600000.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','Setiap Hari Selasa dan Hari Rabu, Honorarium: (4 pekan x 12 Bln) x 200.000 = 4.800.000',1,4,'2026-04-15 16:23:00.000'),
(128,3,2026,'Pengembangan Jaringan Dakwah','Pokok ','8. Kajian Baitul Hikmah (KBH): Ahad pertama: Kitab Madarijus Salikin oleh Ustadz Dr. H. Muhsin Haryanto, M.Ag.  Ahad kedua: Kitab Al-Hikam oleh Ustadz Dr. H.M. Damami Zein, M.Ag. Ahad ketiga: Kajian Siroh Nabawiyah oleh Ustadz H. Akhmad Arif Rifan, S.H.I., M.Si. Ahad keempat: Kajian HPT oleh Ustadz H. Asep Shalahuddin, S.Ag., M.Pd.I. Kajian dimulai dengan Tahsin Qur\'an oleh Ustadz H. Aris Madani, S.Pd.I. ',NULL,'Seluruh warga persyarikatan (PDM, PCM, PRM, Ortom, AUM, Masjid beserta Takmir dan Jama\'ahnya)','Meningkatkan Iman & Taqwa serta Akhlak terutama mendalami tentang Kitab.','Ceramah dan tanya jawab. ','Kegiatan terlaksana ','61600000.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','Sepekan sekali (setiap Hari Ahad, pukul 20.00-21.30 WIB)     Konsumsi, Kebersihan, Transport Narasumber: (4 pekan x 11 Bln) x Rp600 = 26.400,- Narasumber Kajian: (4 pekan x 11 Bln) x Rp400 = 17.600,- Narasumber Tahsin: (4 pekan x 11 Bln) x Rp150 = 6.600,-',1,4,'2026-04-15 16:23:00.000'),
(129,3,2026,'Pengembangan Jaringan Dakwah','Pokok ','9. Kajian Fathul Asrar Miftahussa\'adah (Ideologi Kemuhammadiyahan dan Kajian Tematik)',NULL,'Seluruh warga persyarikatan (PDM, PCM, PRM, Ortom, AUM, Masjid beserta Takmir dan Jama\'ahnya)','Meningkatkan Iman & Taqwa serta Akhlak terutama dalam bidang Ibadah dan Muamalah','Ceramah dan tanya jawab. ','Kegiatan terlaksana ','28600000.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','Sepekan sekali (setiap Hari Sabtu, pukul 05.00-06.00 WIB), Narasumber: (4 pekan x 11 Bln) x Rp400 = 17.600,- Operator Studio: (4 pekan x 11 Bln) x Rp200 = 8.800,- Moderator: (4 pekan x 11 Bln) x Rp50 = 2.200,- Total: 28.600',1,4,'2026-04-15 16:23:00.000'),
(130,3,2026,'Pengembangan Jaringan Dakwah','Pokok ','10. Pengajian SEKETEWU (Setu Ketelu Ben Wulan)',NULL,'Seluruh masyarakat umum, tetangga sekitar kantor PDM Kota Yogyakarta dan yang lebih luas.','Meningkatkan Iman & Taqwa serta Akhlak. Meningkatkan hubungan silaturahmi dan ukhuwah PDM Kota Yogyakarta dan masyarakat umum.','Ceramah dan tanya jawab. ','Kegiatan terlaksana ','6000000.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','Sebulan sekali, Honorarium:  12 Bln x 500 = 6.000,-',1,4,'2026-04-15 16:23:00.000'),
(131,3,2026,'Pengembangan Jaringan Dakwah, Peningkatan, dan Pemberdayaan Sumber Daya Insani','Pokok ','1. Keluarga Sakinah \'Katresnan Suci\' kerjasama dengan Majelis Tabligh dan Ketarjihan PDA Kota Yogyakarta',NULL,'Seluruh warga persyarikatan (PDM, PCM, PRM, Ortom, AUM, Masjid beserta Takmir dan Jama\'ahnya)','Memfasilitasi kader persyarikatan dalam membentuk keluarga sakinah sesuai syariat Islam.','Bimbingan melalui Kajian, memfasilitasi pertemuan, dan proses khitbah, serta Khotbah Nikah. ','Kegiatan terlaksana ','3600000.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','Sebulan sekali, Honorarium:  12 Bln x 300 = 3.600,-',1,4,'2026-04-15 16:23:00.000'),
(132,3,2026,'Pengembangan Jaringan Dakwah, Peningkatan, dan Pemberdayaan Sumber Daya Insani','Pokok ','2. Kajian Fajar Ramadhan (KFR)',NULL,'Seluruh warga persyarikatan (PDM, PCM, PRM, Ortom, AUM, Masjid beserta Takmir dan Jama\'ahnya)','Meningkatkan Iman & Taqwa serta Akhlak terutama dalam bidang Ibadah dan Muamalah Bulan Ramadhan','Ceramah dan tanya jawab. ','Kegiatan terlaksana ','9000000.00','2026-02-01 00:00:00.000','2026-03-31 00:00:00.000','Pada Bulan Ramadhan, Honorarium:  30 Bln x 300 = 9.000',1,4,'2026-04-15 16:23:00.000'),
(133,3,2026,'Pengembangan Jaringan Dakwah, Peningkatan, dan Pemberdayaan Sumber Daya Insani','Bantu','3. Penyusunan Teks Khotbah Jumat dan Sholat Ied (berbahasa Indonesia dan Jawa)',NULL,'Seluruh warga persyarikatan (PDM, PCM, PRM, Ortom, AUM, Masjid beserta Takmir dan Jama\'ahnya)','Khotbah Jumat yang sesuai dengan HPT (Al Quran & AS Sunnah Al Maqbullah).','Pendistribusian teks Khotbah Jum\'at','Kegiatan terlaksana ','4800000.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','Terbit sebulan sekali, Honorarium: 12 Bln x 4 naskah x 100,- = .4.800,-',1,4,'2026-04-15 16:23:00.000'),
(134,3,2026,'Pengembangan Jaringan Dakwah, Peningkatan, dan Pemberdayaan Sumber Daya Insani','Bantu','4. Produksi dan Penyebaran Tabligh Video: Ceramah Keislaman Muhammadiyah',NULL,'Seluruh warga persyarikatan (PDM, PCM, PRM, Ortom, AUM, Masjid beserta Takmir dan Jama\'ahnya)','Jumlah Tabligh Video: Ceramah Keislaman Muhammadiyah','rekaman video dan publikasi','Kegiatan terlaksana ','1200000.00','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','Sebulan sekali, Honorarium:  12 Bln x 100 = 1.200',1,4,'2026-04-15 16:23:00.000');

/*Table structure for table `proposal` */

DROP TABLE IF EXISTS `proposal`;

CREATE TABLE `proposal` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `unit_id` int(11) NOT NULL,
  `pemohon_id` int(11) NOT NULL,
  `tanggal` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `judul` varchar(191) NOT NULL,
  `activity_type_id` int(11) NOT NULL,
  `status_terakhir` varchar(191) NOT NULL DEFAULT 'PENDING',
  `proker_id` int(11) DEFAULT NULL,
  `latar_belakang` text DEFAULT NULL,
  `tujuan` text DEFAULT NULL,
  `bentuk_kegiatan` text DEFAULT NULL,
  `jumlah_peserta` int(11) DEFAULT NULL,
  `kerjasama` varchar(191) DEFAULT NULL,
  `peralatan` text DEFAULT NULL,
  `tanggal_mulai` datetime(3) DEFAULT NULL,
  `tanggal_selesai` datetime(3) DEFAULT NULL,
  `tempat` text DEFAULT NULL,
  `susunan_panitia` text DEFAULT NULL,
  `file_dokumen` varchar(191) DEFAULT NULL,
  `dibayar_oleh_id` int(11) DEFAULT NULL,
  `tanggal_bayar` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Proposal_unit_id_idx` (`unit_id`),
  KEY `Proposal_pemohon_id_idx` (`pemohon_id`),
  KEY `Proposal_activity_type_id_fkey` (`activity_type_id`),
  KEY `Proposal_proker_id_fkey` (`proker_id`),
  KEY `Proposal_dibayar_oleh_id_fkey` (`dibayar_oleh_id`),
  KEY `Proposal_status_terakhir_idx` (`status_terakhir`),
  CONSTRAINT `Proposal_activity_type_id_fkey` FOREIGN KEY (`activity_type_id`) REFERENCES `activitytype` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `Proposal_dibayar_oleh_id_fkey` FOREIGN KEY (`dibayar_oleh_id`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Proposal_pemohon_id_fkey` FOREIGN KEY (`pemohon_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `Proposal_proker_id_fkey` FOREIGN KEY (`proker_id`) REFERENCES `programkerja` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Proposal_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `unit` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `proposal` */

insert  into `proposal`(`id`,`unit_id`,`pemohon_id`,`tanggal`,`judul`,`activity_type_id`,`status_terakhir`,`proker_id`,`latar_belakang`,`tujuan`,`bentuk_kegiatan`,`jumlah_peserta`,`kerjasama`,`peralatan`,`tanggal_mulai`,`tanggal_selesai`,`tempat`,`susunan_panitia`,`file_dokumen`,`dibayar_oleh_id`,`tanggal_bayar`) values 
(2,15,9,'2026-03-16 13:57:29.888','Seni sastra dan tradisi',2,'PAID',3,'Pentas seni karawitan','Pentas karawitan','Karawitan',123,'Belum ada Mitra','ATK, Konsumsi, Kendaraan, Gamelan','2026-03-01 00:00:00.000','2026-09-30 00:00:00.000','Aula','Ketua\nWakil\nSkretaris',NULL,8,'2026-03-16 00:00:00.000'),
(3,15,10,'2026-03-16 14:13:47.003','Seni sastra dan tradisi2',2,'APPROVED_STEP_15',3,'Pentas seni karawitan','Pentas karawitan','zzz',1234,'','zzz','2026-03-01 00:00:00.000','2026-09-30 00:00:00.000','zzz','zzz',NULL,NULL,NULL),
(4,15,9,'2026-03-17 00:56:27.160','Seni sastra dan tradisi 1',4,'PAID',4,'Pelatihan Penulisan dan Digitalisasi Aksara Jawa','Mengenalkan sekaligus melestarikan warisan budaya berupa Aksara Jawa kepada seluruh warga Muhammadiyah agar dapat menjadi salah satu komponen yang dipertimbangkan agar font Aksara Jawa diakui oleh dunia','Operasional harian',10,'-','alat tulis kantor','2026-01-01 00:00:00.000','2026-12-31 00:00:00.000','Kantor PDM','-',NULL,8,'2026-03-17 00:00:00.000'),
(5,15,9,'2026-04-18 11:06:58.794','PRA Got Talent Ke 1',1,'PAID',2,'Kegiatan pencarian bakat untuk PRA se Kota DIY - Rapat','Mencari bibit berbakat dari kalangan PRA - Rapat','Rapat',15,'Blm ada mitra','ruang, soundsisterm, kursi ','2026-04-30 00:00:00.000','2026-04-30 00:00:00.000','PDM Jogja','Ketua: Joko\nWakil: Budi\nSekretari: Cici',NULL,8,'2026-04-18 00:00:00.000'),
(6,15,9,'2026-04-18 11:29:13.837','PRA Got Talent ke 2',1,'APPROVED_FINAL',2,'Kegiatan pencarian bakat untuk PRA se Kota DIY - rapat ke 2','Mencari bibit berbakat dari kalangan PRA - rapat ke 2','rapat ke 2',25,'Mitra dalam konfirmasi ','Kursi, mic','2026-08-31 00:00:00.000','2026-08-31 00:00:00.000','Hotel Ayarta','Ketua\nwkail\nsekretaris',NULL,NULL,NULL);

/*Table structure for table `proposaldetail` */

DROP TABLE IF EXISTS `proposaldetail`;

CREATE TABLE `proposaldetail` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `proposal_id` int(11) NOT NULL,
  `expense_reference_id` int(11) NOT NULL,
  `account_id` int(11) NOT NULL,
  `deskripsi` varchar(191) NOT NULL,
  `nominal` decimal(15,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ProposalDetail_proposal_id_fkey` (`proposal_id`),
  KEY `ProposalDetail_expense_reference_id_fkey` (`expense_reference_id`),
  KEY `ProposalDetail_account_id_fkey` (`account_id`),
  CONSTRAINT `ProposalDetail_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `account` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `ProposalDetail_expense_reference_id_fkey` FOREIGN KEY (`expense_reference_id`) REFERENCES `expensereference` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `ProposalDetail_proposal_id_fkey` FOREIGN KEY (`proposal_id`) REFERENCES `proposal` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `proposaldetail` */

insert  into `proposaldetail`(`id`,`proposal_id`,`expense_reference_id`,`account_id`,`deskripsi`,`nominal`) values 
(5,2,1,4,'snack','500000.00'),
(6,2,2,1,'sewa mobil','1500000.00'),
(9,4,4,3,'Alat tulis kantor','5500000.00'),
(10,4,1,4,'','500000.00'),
(11,5,1,1,'Pembelian Snack','150000.00'),
(12,6,3,2,'honor ','250000.00'),
(13,3,1,1,'Konsumsi','3000000.00'),
(14,3,2,2,'cetak','2000000.00');

/*Table structure for table `role` */

DROP TABLE IF EXISTS `role`;

CREATE TABLE `role` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama_jabatan` varchar(191) NOT NULL,
  `level` int(11) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=105 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `role` */

insert  into `role`(`id`,`nama_jabatan`,`level`,`is_active`) values 
(1,'Staff',1,1),
(3,'Ketua Unit',3,1),
(5,'Bendahara PDM',5,1),
(99,'IT Support',99,1),
(100,'Super Admin',99,1),
(101,'Penginput Usulan Unit',1,1),
(102,'Atasan Penginput',2,1),
(103,'Reviewer PDM',3,1),
(104,'Approval PDM',4,1);

/*Table structure for table `unit` */

DROP TABLE IF EXISTS `unit`;

CREATE TABLE `unit` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama_unit` varchar(191) NOT NULL,
  `nama_unit_pendek` varchar(191) DEFAULT NULL,
  `pemerhati` varchar(191) DEFAULT NULL,
  `parent_unit_id` int(11) DEFAULT NULL,
  `tipe` varchar(191) NOT NULL DEFAULT 'UNIT',
  PRIMARY KEY (`id`),
  KEY `Unit_parent_unit_id_fkey` (`parent_unit_id`),
  CONSTRAINT `Unit_parent_unit_id_fkey` FOREIGN KEY (`parent_unit_id`) REFERENCES `unit` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=156 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `unit` */

insert  into `unit`(`id`,`nama_unit`,`nama_unit_pendek`,`pemerhati`,`parent_unit_id`,`tipe`) values 
(1,'PDM Kota Jogja','','',NULL,'UNIT'),
(2,'Majelis Tarjih dan Tajdid','MTT','H. Aris madani, S.Pd.I	\r\n',27,'UNIT'),
(3,'Majelis Tabligh','MT','Drs. H. Aris Thobirin, M.Si.\r\n',27,'UNIT'),
(4,'Majelis Dikdasmen & PNF','Dikdasmen PNF','',27,'UNIT'),
(5,'Majelis Pendidikan Kader dan Sumber Daya Insani','MPKSDI','Drs. Rochmat, M.Pd.\r\n',27,'UNIT'),
(6,'Majelis Pembinaan Kesehatan Umum','MPKU','Edi Sukoco\r\n',27,'UNIT'),
(7,'Majelis Pembinaan Kesejahteraan Sosial','MPKS','H. Edi Sukoco, S.Kep., Ns\r\n',27,'UNIT'),
(8,'Majelis Ekonomi, Bisnis dan Pariwisata','MEBP','Heri Ananta\r\n',27,'UNIT'),
(9,'Majelis Pendayagunaan Wakaf','MPW','Agni Sutanta, S.I.P',27,'UNIT'),
(10,'Majelis Pemberdayaan Masyarakat','MPM','H. Edi Sukoco, S.Kep., Ns\r\n',27,'UNIT'),
(11,'Majelis Hukum dan Hak Asasi Manusia','MHH','',27,'UNIT'),
(12,'Majelis Lingkungan Hidup','MLH','Sumiharto, SE., MBA\r\n',27,'UNIT'),
(13,'Lembaga Pengembangan Pesantren','LPP','Drs Aris Thobirin, M,Si',27,'UNIT'),
(14,'Lembaga Pengembangan Cabang Ranting dan Pembinaan Masjid','LPCRPM','Agni Sutanta, S.I.P.\r\n',27,'UNIT'),
(15,'Lembaga Pembinaan dan Pengawasan Keuangan','LPPK','Noviar Handi Al Faani, SE., Akt.',27,'UNIT'),
(16,'Lembaga Resiliensi Bencana','LRB/MDMC','Heru Suroso, S.H.',27,'UNIT'),
(17,'Lembaga Amil Zakat, Infak dan Sedekah','LazisMu','',27,'UNIT'),
(18,'Lembaga Pengembangan Usaha Mikro Kecil Menengah','LP-UMKM','',27,'UNIT'),
(19,'Lembaga Hikmah dan Kebijakan Publik','LHKP','Abdus Samik Sandhi',27,'UNIT'),
(20,'Lembaga Seni Budaya','LSB','Aris Saptono\r\n',27,'UNIT'),
(21,'Lembaga Pengembangan Olahraga','LPO','',27,'UNIT'),
(22,'Lembaga Pembinaan Haji dan Umroh','LPHU','R. Sumiharto, SE., MBA.\r\n',27,'UNIT'),
(23,'Majelis Pustaka dan Informasi','MPI','',27,'UNIT'),
(24,'Struktur Teritorial (Cabang & Ranting)','CABANG',NULL,1,'GROUP'),
(25,'Organisasi Otonom (Ortom)','ORTOM',NULL,1,'GROUP'),
(26,'Amal Usaha Muhammadiyah (AUM)','AUM',NULL,1,'GROUP'),
(27,'Unsur Pembantu Pimpinan (Majelis & Lembaga)','MJL-LMG',NULL,1,'GROUP'),
(28,'Pimpinan Cabang Muhammadiyah','PCM',NULL,24,'GROUP'),
(29,'Aisyiyah','',NULL,25,'GROUP'),
(30,'Nasyiatul Aisyiyah ','NA',NULL,25,'GROUP'),
(31,'Pemuda Muhammadiyah','PM',NULL,25,'GROUP'),
(32,'Ikatan Pelajar Muhammadiyah','IPM',NULL,25,'GROUP'),
(33,'Ikatan Mahasiswa Muhammadiyah','IMM',NULL,25,'GROUP'),
(34,'Tapak Suci Putra','TSP',NULL,25,'GROUP'),
(35,'Hizbul Wathan','HW',NULL,25,'GROUP'),
(36,'Bidang Pendidikan',NULL,NULL,26,'GROUP'),
(37,'Bidang Kesehatan',NULL,NULL,26,'GROUP'),
(38,'Bidang Sosial',NULL,NULL,26,'GROUP'),
(39,'Bidang Ekonomi',NULL,NULL,26,'GROUP'),
(40,'PCM Danurejan',NULL,NULL,28,'GROUP'),
(41,'PCM Gedongtengen',NULL,NULL,28,'GROUP'),
(42,'PCM Gondokusuman',NULL,NULL,28,'GROUP'),
(43,'PCM Gondomanan',NULL,NULL,28,'GROUP'),
(44,'PCM Jetis',NULL,NULL,28,'GROUP'),
(45,'PCM Kotagede',NULL,NULL,28,'GROUP'),
(46,'PCM Kraton',NULL,NULL,28,'GROUP'),
(47,'PCM Mantrijeron',NULL,NULL,28,'GROUP'),
(48,'PCM Mergangsan',NULL,NULL,28,'GROUP'),
(49,'PCM Ngampilan',NULL,NULL,28,'GROUP'),
(50,'PCM Pakualaman',NULL,NULL,28,'GROUP'),
(51,'PCM Tegalrejo',NULL,NULL,28,'GROUP'),
(52,'PCM Umbulharjo',NULL,NULL,28,'GROUP'),
(53,'PCM Wirobrajan',NULL,NULL,28,'GROUP'),
(54,'PRM Bumijo',NULL,NULL,44,'UNIT'),
(55,'PRM Cokrodiningratan',NULL,NULL,44,'UNIT'),
(56,'PRM Gowongan',NULL,NULL,44,'UNIT'),
(57,'PRM Terban',NULL,NULL,42,'UNIT'),
(58,'PRM Demangan',NULL,NULL,42,'UNIT'),
(59,'PRM Klitren',NULL,NULL,42,'UNIT'),
(60,'PRM Kotabaru',NULL,NULL,42,'UNIT'),
(61,'PRM Baciro',NULL,NULL,42,'UNIT'),
(62,'PRM Bausasran',NULL,NULL,40,'UNIT'),
(63,'PRM Tegal Panggung',NULL,NULL,40,'UNIT'),
(64,'PRM Suryatmajan',NULL,NULL,40,'UNIT'),
(65,'PRM Ngampilan',NULL,NULL,49,'UNIT'),
(66,'PRM Notoprajan',NULL,NULL,49,'UNIT'),
(67,'PRM Panembahan',NULL,NULL,46,'UNIT'),
(68,'PRM Kadipaten',NULL,NULL,46,'UNIT'),
(69,'PRM Patehan',NULL,NULL,46,'UNIT'),
(70,'PRM Prawirodirjan',NULL,NULL,43,'UNIT'),
(71,'PRM Ngupasan',NULL,NULL,43,'UNIT'),
(72,'PRM Purwokinanti',NULL,NULL,50,'UNIT'),
(73,'PRM Gunungketur',NULL,NULL,50,'UNIT'),
(74,'PRM Wirobrajan',NULL,NULL,53,'UNIT'),
(75,'PRM Patangpuluhan',NULL,NULL,53,'UNIT'),
(76,'PRM Pakuncen',NULL,NULL,53,'UNIT'),
(77,'PRM Tegalrejo',NULL,NULL,51,'UNIT'),
(78,'PRM Karangwaru',NULL,NULL,51,'UNIT'),
(79,'PRM Kricak',NULL,NULL,51,'UNIT'),
(80,'PRM Bener',NULL,NULL,51,'UNIT'),
(81,'PRM Sosromenduran',NULL,NULL,41,'UNIT'),
(82,'PRM Pringgokusuman',NULL,NULL,41,'UNIT'),
(83,'PRM Prenggan',NULL,NULL,45,'UNIT'),
(84,'PRM Purbayan',NULL,NULL,45,'UNIT'),
(85,'PRM Rejowinangun',NULL,NULL,45,'UNIT'),
(86,'PRM Pandeyan',NULL,NULL,52,'UNIT'),
(87,'PRM Sorosutan',NULL,NULL,52,'UNIT'),
(88,'PRM Giwangan',NULL,NULL,52,'UNIT'),
(89,'PRM Warungboto',NULL,NULL,52,'UNIT'),
(90,'PRM Mujamuju',NULL,NULL,52,'UNIT'),
(91,'PRM Tahunan',NULL,NULL,52,'UNIT'),
(92,'PRM Semaki',NULL,NULL,52,'UNIT'),
(93,'PRM Brontokusuman',NULL,NULL,48,'UNIT'),
(94,'PRM Keparakan',NULL,NULL,48,'UNIT'),
(95,'PRM Wirogunan',NULL,NULL,48,'UNIT'),
(96,'PRM Mantrijeron',NULL,NULL,47,'UNIT'),
(97,'PRM Suryodiningratan',NULL,NULL,47,'UNIT'),
(98,'PRM Gedongkiwo',NULL,NULL,47,'UNIT'),
(99,'SD Muhammadiyah',NULL,NULL,36,'GROUP'),
(100,'SMP Muhammadiyah',NULL,NULL,36,'GROUP'),
(101,'Panti Asuhan Yatim (PAY)',NULL,NULL,38,'UNIT'),
(102,'koperasi',NULL,NULL,39,'GROUP'),
(103,'BMT',NULL,NULL,39,'GROUP'),
(104,'SD MUHAMMADIYAH BAUSASRAN I',NULL,NULL,99,'UNIT'),
(105,'SD MUHAMMADIYAH BAUSASRAN II',NULL,NULL,99,'UNIT'),
(106,'SD MUHAMMADIYAH DANUNEGARAN',NULL,NULL,99,'UNIT'),
(107,'SD MUHAMMADIYAH DEMANGAN',NULL,NULL,99,'UNIT'),
(108,'SD MUHAMMADIYAH GENDENG',NULL,NULL,99,'UNIT'),
(109,'SD MUHAMMADIYAH JOGOKARIYAN',NULL,NULL,99,'UNIT'),
(110,'SD MUHAMMADIYAH KARANGKAJEN I',NULL,NULL,99,'UNIT'),
(111,'SD MUHAMMADIYAH KARANGKAJEN II',NULL,NULL,99,'UNIT'),
(112,'SD MUHAMMADIYAH KARANGWARU',NULL,NULL,99,'UNIT'),
(113,'SD MUHAMMADIYAH KAUMAN YOGYAKARTA',NULL,NULL,99,'UNIT'),
(114,'SD MUHAMMADIYAH KLECO 1',NULL,NULL,99,'UNIT'),
(115,'SD MUHAMMADIYAH KLECO 2',NULL,NULL,99,'UNIT'),
(116,'SD MUHAMMADIYAH KLECO 3',NULL,NULL,99,'UNIT'),
(117,'SD MUHAMMADIYAH MILIRAN',NULL,NULL,99,'UNIT'),
(118,'SD MUHAMMADIYAH NGADIWINATAN',NULL,NULL,99,'UNIT'),
(119,'SD MUHAMMADIYAH NGUPASAN 1 YOGYAKARTA',NULL,NULL,99,'UNIT'),
(120,'SD MUHAMMADIYAH NGUPASAN II',NULL,NULL,99,'UNIT'),
(121,'SD MUHAMMADIYAH NITIKAN',NULL,NULL,99,'UNIT'),
(122,'SD MUHAMMADIYAH NOTOPRAJAN',NULL,NULL,99,'UNIT'),
(123,'SD MUHAMMADIYAH NOTOPRAJAN 2',NULL,NULL,99,'UNIT'),
(124,'SD MUHAMMADIYAH PAKEL',NULL,NULL,99,'UNIT'),
(125,'SD MUHAMMADIYAH PRINGGOKUSUMAN',NULL,NULL,99,'UNIT'),
(126,'SD MUHAMMADIYAH PURBAYAN',NULL,NULL,99,'UNIT'),
(127,'SD MUHAMMADIYAH PURWODININGRATAN 2',NULL,NULL,99,'UNIT'),
(128,'SD MUHAMMADIYAH PURWODININGRATAN I',NULL,NULL,99,'UNIT'),
(129,'SD MUHAMMADIYAH SAGAN',NULL,NULL,99,'UNIT'),
(130,'SD MUHAMMADIYAH SAPEN 1',NULL,NULL,99,'UNIT'),
(131,'SD MUHAMMADIYAH SAPEN II',NULL,NULL,99,'UNIT'),
(132,'SD MUHAMMADIYAH SOKONANDI 1',NULL,NULL,99,'UNIT'),
(133,'SD MUHAMMADIYAH SOKONANDI 2',NULL,NULL,99,'UNIT'),
(134,'SD MUHAMMADIYAH SURONATAN',NULL,NULL,99,'UNIT'),
(135,'SD MUHAMMADIYAH SURYOWIJAYAN',NULL,NULL,99,'UNIT'),
(136,'SD MUHAMMADIYAH TEGALREJO',NULL,NULL,99,'UNIT'),
(137,'SD MUHAMMADIYAH WARUNGBOTO',NULL,NULL,99,'UNIT'),
(138,'SD MUHAMMADIYAH WIROBRAJAN I',NULL,NULL,99,'UNIT'),
(139,'SD MUHAMMADIYAH WIROBRAJAN II',NULL,NULL,99,'UNIT'),
(140,'SD MUHAMMADIYAH WIROBRAJAN III',NULL,NULL,99,'UNIT'),
(141,'SMP MUHAMMADIYAH 1 YOGYAKARTA',NULL,NULL,100,'UNIT'),
(142,'SMP MUHAMMADIYAH 2 YOGYAKARTA',NULL,NULL,100,'UNIT'),
(143,'SMP MUHAMMADIYAH 3 YOGYAKARTA',NULL,NULL,100,'UNIT'),
(144,'SMP MUHAMMADIYAH 4 YOGYAKARTA',NULL,NULL,100,'UNIT'),
(145,'SMP MUHAMMADIYAH 5 YOGYAKARTA',NULL,NULL,100,'UNIT'),
(146,'SMP MUHAMMADIYAH 6 YOGYAKARTA',NULL,NULL,100,'UNIT'),
(147,'SMP MUHAMMADIYAH 7 YOGYAKARTA',NULL,NULL,100,'UNIT'),
(148,'SMP MUHAMMADIYAH 8 YOGYAKARTA',NULL,NULL,100,'UNIT'),
(149,'SMP MUHAMMADIYAH 9 YOGYAKARTA',NULL,NULL,100,'UNIT'),
(150,'SMP MUHAMMADIYAH 10 YOGYAKARTA',NULL,NULL,100,'UNIT'),
(151,'PKU Kotagede',NULL,NULL,37,'UNIT'),
(152,'.',NULL,NULL,100,'UNIT'),
(153,'.',NULL,NULL,100,'UNIT'),
(154,'.',NULL,NULL,100,'UNIT'),
(155,'.',NULL,NULL,100,'UNIT');

/*Table structure for table `unitpagu` */

DROP TABLE IF EXISTS `unitpagu`;

CREATE TABLE `unitpagu` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `unit_id` int(11) NOT NULL,
  `tahun` int(11) NOT NULL,
  `nominal` decimal(15,2) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UnitPagu_unit_id_tahun_key` (`unit_id`,`tahun`),
  CONSTRAINT `UnitPagu_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `unit` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=156 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `unitpagu` */

insert  into `unitpagu`(`id`,`unit_id`,`tahun`,`nominal`,`createdAt`,`updatedAt`) values 
(1,1,2026,'0.00','2026-03-16 12:10:46.597','2026-04-18 09:07:55.014'),
(2,2,2026,'1000000000.00','2026-03-16 12:10:46.692','2026-04-18 09:07:55.031'),
(3,3,2026,'1000000000.00','2026-03-16 12:10:46.759','2026-04-18 09:07:55.047'),
(4,4,2026,'1000000000.00','2026-03-16 12:10:46.823','2026-04-18 09:07:55.062'),
(5,5,2026,'1000000000.00','2026-03-16 12:10:46.887','2026-04-18 09:07:55.078'),
(6,6,2026,'1000000000.00','2026-03-16 12:10:46.944','2026-04-18 09:07:55.092'),
(7,7,2026,'1000000000.00','2026-03-16 12:10:47.012','2026-04-18 09:07:55.107'),
(8,8,2026,'1000000000.00','2026-03-16 12:10:47.086','2026-04-18 09:07:55.126'),
(9,9,2026,'1000000000.00','2026-03-16 12:10:47.167','2026-04-18 09:07:55.144'),
(10,10,2026,'1000000000.00','2026-03-16 12:10:47.232','2026-04-18 09:07:55.164'),
(11,11,2026,'1000000000.00','2026-03-16 12:10:47.302','2026-04-18 09:07:55.179'),
(12,12,2026,'1000000000.00','2026-03-16 12:10:47.364','2026-04-18 09:07:55.196'),
(13,13,2026,'1000000000.00','2026-03-16 12:10:47.423','2026-04-18 09:07:55.215'),
(14,14,2026,'1000000000.00','2026-03-16 12:10:47.513','2026-04-18 09:07:55.240'),
(15,15,2026,'1000000000.00','2026-03-16 12:10:47.587','2026-04-18 09:07:55.258'),
(16,16,2026,'1000000000.00','2026-03-16 12:10:47.649','2026-04-18 09:07:55.276'),
(17,17,2026,'1000000000.00','2026-03-16 12:10:47.727','2026-04-18 09:07:55.291'),
(18,18,2026,'1000000000.00','2026-03-16 12:10:47.784','2026-04-18 09:07:55.306'),
(19,19,2026,'1000000000.00','2026-03-16 12:10:47.846','2026-04-18 09:07:55.321'),
(20,20,2026,'1000000000.00','2026-03-16 12:10:47.902','2026-04-18 09:07:55.335'),
(21,21,2026,'1000000000.00','2026-03-16 12:10:47.965','2026-04-18 09:07:55.349'),
(22,22,2026,'1000000000.00','2026-03-16 12:10:48.023','2026-04-18 09:07:55.363'),
(23,23,2026,'1000000000.00','2026-04-18 08:47:44.627','2026-04-18 09:07:55.376'),
(24,24,2026,'0.00','2026-04-18 08:47:44.651','2026-04-18 09:07:55.390'),
(25,25,2026,'0.00','2026-04-18 08:47:44.668','2026-04-18 09:07:55.404'),
(26,26,2026,'0.00','2026-04-18 08:47:44.684','2026-04-18 09:07:55.417'),
(27,27,2026,'0.00','2026-04-18 08:47:44.701','2026-04-18 09:07:55.433'),
(28,28,2026,'0.00','2026-04-18 08:47:44.716','2026-04-18 09:07:55.448'),
(29,29,2026,'0.00','2026-04-18 08:47:44.731','2026-04-18 09:07:55.463'),
(30,30,2026,'0.00','2026-04-18 08:47:44.746','2026-04-18 09:07:55.477'),
(31,31,2026,'0.00','2026-04-18 08:47:44.762','2026-04-18 09:07:55.492'),
(32,32,2026,'0.00','2026-04-18 08:47:44.779','2026-04-18 09:07:55.506'),
(33,33,2026,'0.00','2026-04-18 08:47:44.796','2026-04-18 09:07:55.525'),
(34,34,2026,'0.00','2026-04-18 08:47:44.810','2026-04-18 09:07:55.543'),
(35,35,2026,'0.00','2026-04-18 08:47:44.825','2026-04-18 09:07:55.557'),
(36,36,2026,'0.00','2026-04-18 08:47:44.840','2026-04-18 09:07:55.571'),
(37,37,2026,'0.00','2026-04-18 08:47:44.855','2026-04-18 09:07:55.585'),
(38,38,2026,'0.00','2026-04-18 08:47:44.870','2026-04-18 09:07:55.599'),
(39,39,2026,'0.00','2026-04-18 08:47:44.884','2026-04-18 09:07:55.618'),
(40,40,2026,'0.00','2026-04-18 08:47:44.901','2026-04-18 09:07:55.633'),
(41,41,2026,'0.00','2026-04-18 08:47:44.915','2026-04-18 09:07:55.648'),
(42,42,2026,'0.00','2026-04-18 08:47:44.931','2026-04-18 09:07:55.662'),
(43,43,2026,'0.00','2026-04-18 08:47:44.945','2026-04-18 09:07:55.687'),
(44,44,2026,'0.00','2026-04-18 08:47:44.961','2026-04-18 09:07:55.715'),
(45,45,2026,'0.00','2026-04-18 08:47:44.976','2026-04-18 09:07:55.732'),
(46,46,2026,'0.00','2026-04-18 08:47:44.990','2026-04-18 09:07:55.746'),
(47,47,2026,'0.00','2026-04-18 08:47:45.006','2026-04-18 09:07:55.760'),
(48,48,2026,'0.00','2026-04-18 08:47:45.021','2026-04-18 09:07:55.774'),
(49,49,2026,'0.00','2026-04-18 08:47:45.037','2026-04-18 09:07:55.788'),
(50,50,2026,'0.00','2026-04-18 08:47:45.051','2026-04-18 09:07:55.808'),
(51,51,2026,'0.00','2026-04-18 08:47:45.066','2026-04-18 09:07:55.823'),
(52,52,2026,'0.00','2026-04-18 08:47:45.080','2026-04-18 09:07:55.836'),
(53,53,2026,'0.00','2026-04-18 08:47:45.096','2026-04-18 09:07:55.850'),
(54,54,2026,'0.00','2026-04-18 08:47:45.110','2026-04-18 09:07:55.864'),
(55,55,2026,'0.00','2026-04-18 08:47:45.125','2026-04-18 09:07:55.883'),
(56,56,2026,'0.00','2026-04-18 08:47:45.140','2026-04-18 09:07:55.905'),
(57,57,2026,'0.00','2026-04-18 08:47:45.155','2026-04-18 09:07:55.921'),
(58,58,2026,'0.00','2026-04-18 08:47:45.168','2026-04-18 09:07:55.936'),
(59,59,2026,'0.00','2026-04-18 08:47:45.183','2026-04-18 09:07:55.950'),
(60,60,2026,'0.00','2026-04-18 08:47:45.198','2026-04-18 09:07:55.965'),
(61,61,2026,'0.00','2026-04-18 08:47:45.213','2026-04-18 09:07:55.980'),
(62,62,2026,'0.00','2026-04-18 08:47:45.229','2026-04-18 09:07:55.995'),
(63,63,2026,'0.00','2026-04-18 08:47:45.243','2026-04-18 09:07:56.009'),
(64,64,2026,'0.00','2026-04-18 08:47:45.259','2026-04-18 09:07:56.024'),
(65,65,2026,'0.00','2026-04-18 08:47:45.273','2026-04-18 09:07:56.038'),
(66,66,2026,'0.00','2026-04-18 08:47:45.291','2026-04-18 09:07:56.054'),
(67,67,2026,'0.00','2026-04-18 08:47:45.307','2026-04-18 09:07:56.068'),
(68,68,2026,'0.00','2026-04-18 08:47:45.321','2026-04-18 09:07:56.082'),
(69,69,2026,'0.00','2026-04-18 08:47:45.335','2026-04-18 09:07:56.098'),
(70,70,2026,'0.00','2026-04-18 08:47:45.350','2026-04-18 09:07:56.111'),
(71,71,2026,'0.00','2026-04-18 08:47:45.365','2026-04-18 09:07:56.125'),
(72,72,2026,'0.00','2026-04-18 08:47:45.383','2026-04-18 09:07:56.139'),
(73,73,2026,'0.00','2026-04-18 08:47:45.398','2026-04-18 09:07:56.155'),
(74,74,2026,'0.00','2026-04-18 08:47:45.413','2026-04-18 09:07:56.169'),
(75,75,2026,'0.00','2026-04-18 08:47:45.428','2026-04-18 09:07:56.183'),
(76,76,2026,'0.00','2026-04-18 08:47:45.442','2026-04-18 09:07:56.196'),
(77,77,2026,'0.00','2026-04-18 08:47:45.457','2026-04-18 09:07:56.212'),
(78,78,2026,'0.00','2026-04-18 08:47:45.470','2026-04-18 09:07:56.225'),
(79,79,2026,'0.00','2026-04-18 08:47:45.485','2026-04-18 09:07:56.240'),
(80,80,2026,'0.00','2026-04-18 08:47:45.500','2026-04-18 09:07:56.253'),
(81,81,2026,'0.00','2026-04-18 08:47:45.514','2026-04-18 09:07:56.268'),
(82,82,2026,'0.00','2026-04-18 08:47:45.528','2026-04-18 09:07:56.284'),
(83,83,2026,'0.00','2026-04-18 08:47:45.543','2026-04-18 09:07:56.299'),
(84,84,2026,'0.00','2026-04-18 08:47:45.558','2026-04-18 09:07:56.313'),
(85,85,2026,'0.00','2026-04-18 08:47:45.572','2026-04-18 09:07:56.326'),
(86,86,2026,'0.00','2026-04-18 08:47:45.587','2026-04-18 09:07:56.340'),
(87,87,2026,'0.00','2026-04-18 08:47:45.601','2026-04-18 09:07:56.354'),
(88,88,2026,'0.00','2026-04-18 08:47:45.620','2026-04-18 09:07:56.369'),
(89,89,2026,'0.00','2026-04-18 08:47:45.651','2026-04-18 09:07:56.383'),
(90,90,2026,'0.00','2026-04-18 08:47:45.665','2026-04-18 09:07:56.397'),
(91,91,2026,'0.00','2026-04-18 08:47:45.680','2026-04-18 09:07:56.412'),
(92,92,2026,'0.00','2026-04-18 08:47:45.695','2026-04-18 09:07:56.427'),
(93,93,2026,'0.00','2026-04-18 08:47:45.708','2026-04-18 09:07:56.440'),
(94,94,2026,'0.00','2026-04-18 08:47:45.723','2026-04-18 09:07:56.455'),
(95,95,2026,'0.00','2026-04-18 08:47:45.740','2026-04-18 09:07:56.469'),
(96,96,2026,'0.00','2026-04-18 08:47:45.753','2026-04-18 09:07:56.482'),
(97,97,2026,'0.00','2026-04-18 08:47:45.768','2026-04-18 09:07:56.496'),
(98,98,2026,'0.00','2026-04-18 08:47:45.783','2026-04-18 09:07:56.509'),
(99,99,2026,'0.00','2026-04-18 08:47:45.797','2026-04-18 09:07:56.524'),
(100,100,2026,'0.00','2026-04-18 08:47:45.811','2026-04-18 09:07:56.538'),
(101,101,2026,'0.00','2026-04-18 08:47:45.827','2026-04-18 09:07:56.554'),
(102,102,2026,'0.00','2026-04-18 08:47:45.842','2026-04-18 09:07:56.587'),
(103,103,2026,'0.00','2026-04-18 08:47:45.856','2026-04-18 09:07:56.611'),
(104,104,2026,'0.00','2026-04-18 08:47:45.870','2026-04-18 09:07:56.627'),
(105,105,2026,'0.00','2026-04-18 08:47:45.883','2026-04-18 09:07:56.641'),
(106,106,2026,'0.00','2026-04-18 08:47:45.899','2026-04-18 09:07:56.655'),
(107,107,2026,'0.00','2026-04-18 08:47:45.913','2026-04-18 09:07:56.669'),
(108,108,2026,'0.00','2026-04-18 08:47:45.926','2026-04-18 09:07:56.698'),
(109,109,2026,'0.00','2026-04-18 08:47:45.941','2026-04-18 09:07:56.721'),
(110,110,2026,'0.00','2026-04-18 08:47:45.956','2026-04-18 09:07:56.735'),
(111,111,2026,'0.00','2026-04-18 08:47:45.970','2026-04-18 09:07:56.749'),
(112,112,2026,'0.00','2026-04-18 08:47:45.985','2026-04-18 09:07:56.764'),
(113,113,2026,'0.00','2026-04-18 08:47:45.999','2026-04-18 09:07:56.779'),
(114,114,2026,'0.00','2026-04-18 08:47:46.014','2026-04-18 09:07:56.794'),
(115,115,2026,'0.00','2026-04-18 08:47:46.029','2026-04-18 09:07:56.808'),
(116,116,2026,'0.00','2026-04-18 08:47:46.043','2026-04-18 09:07:56.824'),
(117,117,2026,'0.00','2026-04-18 08:47:46.057','2026-04-18 09:07:56.839'),
(118,118,2026,'0.00','2026-04-18 08:47:46.070','2026-04-18 09:07:56.854'),
(119,119,2026,'0.00','2026-04-18 08:47:46.086','2026-04-18 09:07:56.870'),
(120,120,2026,'0.00','2026-04-18 08:47:46.101','2026-04-18 09:07:56.884'),
(121,121,2026,'0.00','2026-04-18 08:47:46.115','2026-04-18 09:07:56.900'),
(122,122,2026,'0.00','2026-04-18 08:47:46.129','2026-04-18 09:07:56.915'),
(123,123,2026,'0.00','2026-04-18 08:47:46.144','2026-04-18 09:07:56.931'),
(124,124,2026,'0.00','2026-04-18 08:47:46.158','2026-04-18 09:07:56.946'),
(125,125,2026,'0.00','2026-04-18 08:47:46.172','2026-04-18 09:07:56.961'),
(126,126,2026,'0.00','2026-04-18 08:47:46.185','2026-04-18 09:07:56.978'),
(127,127,2026,'0.00','2026-04-18 08:47:46.200','2026-04-18 09:07:56.993'),
(128,128,2026,'0.00','2026-04-18 08:47:46.215','2026-04-18 09:07:57.008'),
(129,129,2026,'0.00','2026-04-18 08:47:46.229','2026-04-18 09:07:57.024'),
(130,130,2026,'0.00','2026-04-18 08:47:46.243','2026-04-18 09:07:57.040'),
(131,131,2026,'0.00','2026-04-18 08:47:46.257','2026-04-18 09:07:57.056'),
(132,132,2026,'0.00','2026-04-18 08:47:46.272','2026-04-18 09:07:57.071'),
(133,133,2026,'0.00','2026-04-18 08:47:46.286','2026-04-18 09:07:57.086'),
(134,134,2026,'0.00','2026-04-18 08:47:46.300','2026-04-18 09:07:57.101'),
(135,135,2026,'0.00','2026-04-18 08:47:46.313','2026-04-18 09:07:57.119'),
(136,136,2026,'0.00','2026-04-18 08:47:46.329','2026-04-18 09:07:57.133'),
(137,137,2026,'0.00','2026-04-18 08:47:46.343','2026-04-18 09:07:57.149'),
(138,138,2026,'0.00','2026-04-18 08:47:46.356','2026-04-18 09:07:57.164'),
(139,139,2026,'0.00','2026-04-18 08:47:46.371','2026-04-18 09:07:57.179'),
(140,140,2026,'0.00','2026-04-18 08:47:46.388','2026-04-18 09:07:57.195'),
(141,141,2026,'0.00','2026-04-18 08:47:46.401','2026-04-18 09:07:57.209'),
(142,142,2026,'0.00','2026-04-18 08:47:46.416','2026-04-18 09:07:57.224'),
(143,143,2026,'0.00','2026-04-18 08:47:46.430','2026-04-18 09:07:57.240'),
(144,144,2026,'0.00','2026-04-18 08:47:46.444','2026-04-18 09:07:57.255'),
(145,145,2026,'0.00','2026-04-18 08:47:46.458','2026-04-18 09:07:57.270'),
(146,146,2026,'0.00','2026-04-18 08:47:46.472','2026-04-18 09:07:57.284'),
(147,147,2026,'0.00','2026-04-18 08:47:46.487','2026-04-18 09:07:57.299'),
(148,148,2026,'0.00','2026-04-18 08:47:46.501','2026-04-18 09:07:57.314'),
(149,149,2026,'0.00','2026-04-18 08:47:46.516','2026-04-18 09:07:57.329'),
(150,150,2026,'0.00','2026-04-18 08:47:46.530','2026-04-18 09:07:57.345'),
(151,151,2026,'0.00','2026-04-18 08:47:46.545','2026-04-18 09:07:57.362'),
(152,152,2026,'0.00','2026-04-18 08:47:46.558','2026-04-18 09:07:57.378'),
(153,153,2026,'0.00','2026-04-18 08:47:46.572','2026-04-18 09:07:57.392'),
(154,154,2026,'0.00','2026-04-18 08:47:46.587','2026-04-18 09:07:57.407'),
(155,155,2026,'0.00','2026-04-18 08:47:46.601','2026-04-18 09:07:57.422');

/*Table structure for table `user` */

DROP TABLE IF EXISTS `user`;

CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(191) NOT NULL,
  `password` varchar(191) NOT NULL,
  `nama` varchar(191) NOT NULL,
  `nbm` varchar(191) DEFAULT NULL,
  `unit_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_username_key` (`username`),
  KEY `User_unit_id_fkey` (`unit_id`),
  KEY `User_role_id_fkey` (`role_id`),
  CONSTRAINT `User_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `User_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `unit` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `user` */

insert  into `user`(`id`,`username`,`password`,`nama`,`nbm`,`unit_id`,`role_id`) values 
(4,'admin','$2b$10$oWMsz9HB1N54rNEarfH4CualAQhI8R4oSLrcOhgehmxAJdYwYrG9q','Bagus Sri Widodo','',1,100),
(8,'bendahara','$2b$10$ZqOY4goGKry65hniA.DQWejkZkpYaO6O/zxNLFOopPg/thIaCpFsC','Bendahara PDM','',1,5),
(9,'rama','$2b$10$ZqOY4goGKry65hniA.DQWejkZkpYaO6O/zxNLFOopPg/thIaCpFsC','Ramadhani Gafar Utama, SE., M.M.','1.185.353',15,101),
(10,'agus','$2b$10$7d5gkrBWeaVbi0vvWVazyeV78wFZCoprWFwOOAbgnu5mg..XrKdOK','Agus Riadi, S.E., M.Ak.','934.051',15,102),
(11,'ophit','$2b$10$3k7d1SiQNzGFHu.YLWVLBeugqPdq/J20HGbKAWpD9h5UX8FdRK7..','Noviar Handi Al Faani, SE., Akt.','',1,103),
(12,'wahyu MTT','$2b$10$t5nTTuuY.JlBoogMthS1fufFFKzXYK2coNjXsvedXum42G8lrbp5K','Wahyu Wijayanto, S.Sy., M.S.I.','811.236',2,102),
(13,'diyan MTT','$2b$10$Q0Hu2krx5cEq.OqCh8XvhOQeHCc9QmP6NvakAhV4DUU7mQDwi7vem','Diyan Faturahman, S.Ag., M.Pd.','1.275.467',2,101),
(14,'tri MPM','$2b$10$5WuKqdjU6eSPfTk7vBJAM.uDnYrlyvyi44zTRcUdfpXdgvo01nDuu','Tri Antoro Sholeh, ST.','922.253',10,102),
(15,'heru MPM','$2b$10$PZUqvbnVoKbbct2mfY94Dedl4IT/ZYHqgOxRMnWuFJJ7xCgWI..Xq','Heru Raharjo, M.Pd.','868.958',10,101),
(16,'reza MPKU','$2b$10$0JfWoORVHRvJaI8wVNBVXOiXk3IlSteB11XWFELqQc045.gdo7oLC','Reza Al Afsyar Khaitami, S.Kep., Ns., MARS','',6,102),
(17,'irfan MPKU','$2b$10$tqSo4j3Uyc6RcDUW3PXu6eNlPUETNbRirbxLQQ.RFt84W59XTQ/Qa','Irfan Bahtiar Isnaeni','',6,101),
(18,'dedi MPKSDI','$2b$10$oaZITikFxlXPFPGvovq9u.Y99H/Cky8VHypYWF9PbeLO2iLXnLLkW','Dedi Rustandi, S.Pd.','668.941',5,102),
(19,'akhsanul MPKSDI','$2b$10$v0unJNahuQF.pll9IuGzI.H0BSf.aYnuCBFnpv9SIeuAwDQk5KhiK','Akhsanul Fikri Al Anshori, S.Ag.,M.Ag','1.247.724',5,101),
(20,'choirul MPI','$2b$10$3KRU1Bz0YWRNI8MLh7TAxefoG97dN4gIbB4zCwQw9d.yabXVdNBZG','Dr.Choirul Fajri, S.I.Kom.,M.A','1.137.480',23,102),
(21,'fajar MPI','$2b$10$UHctuIX72MO1mxDpqSxV3uE/Qp25nqmTIN.haPA5r06I3qtyxe4He','Fajar Zuliyanti, S.IP','1417971',23,101),
(22,'tri MPKS','$2b$10$Pa8SLBgecHg0APsRxdr8IOsZyWiDt2Nfd1AbEdmv6wos85AjsByuq','Tri Haryanto','',7,102),
(23,'Fatkhunniam MPKS','$2b$10$f1lRj3CIm5lQZ7xr7SVzGeNl2ey31GGsGAYiuNEJxTEexLxQsRk3i','Muhammad Fatkhunniam Arrozi','',7,101),
(24,'hery MLH','$2b$10$jRAZY7g3cTjd78Da2H3xku02GS9IJVGfqqN2mdoMNseaJ5RV1.bwS','Hery Setiyawan, M.Si.','894.358',12,102),
(25,'harris MLH','$2b$10$47E.kszNUl0ftK3Q3/Y7KubWMNzYZXXNAO4PMbzhlcVJYgUw6tDdO','Harris Syarif Usman, SH., M.Kn','934.212',12,101),
(26,'rahmat MHH','$2b$10$NJyvQAIDQZMH8JTKLsIqwOdF8SLKDU2RzmJVtBDqh7xrfDaYABO8y','Rahmat Setiabudi Sokonagoro, SH., LLM., CLL., CLA., Med.','1.430.320',11,102),
(27,'nenik MHH','$2b$10$jFJligSeNztIcQHnqELFWOJ0nXgFRsS4T1gucs3KHsoNCGhC4EwzW','Nenik Herniyawati, SH.','887.523',11,101),
(28,'arif MEBP','$2b$10$xCmtsG9mQdwIHOwNqmK1juxy47wrECbPvqig3edfWthCftn8HEw0S','Dr. Eng. Ir. Muhamad Arif Wibisono, ST., MT., IPM, ASEAN. Eng.','764.312',8,102),
(29,'ridwan MEBP','$2b$10$4YZ/m84SOxhUHEKgJeGinOkVsN0TXHbtRGFNc6PViNcNLbfpw3Snm','Ridwan','1.251.448',8,101),
(30,'erwito LSB','$2b$10$CbNkwFejBRDQ4qgWjosUreJTja27xiZrPqRryRQpPtUVU4jV4M7kO','Ewirto Wibowo','577.056',20,102),
(31,'suwahono LSB','$2b$10$dqAM25BwGSATyDo9x9/c0OCb3s8.rbZnQ6Slcx2pv4saUI34nZvSC','Suwahono','960.434',20,101),
(32,'arifudin LRB','$2b$10$vcB/xEnKtvAzcgad6JRtlu0tBiLvmE8yBl39TGw1ob4bMAUxdrm.K','Arifudin Nurrahman','827.445',16,102),
(33,'siti LRB','$2b$10$6Jv0QJfMqvUIWM/D9.r41.ICPI58hIdARcaLgNACbz.U7Eg282W/m','Siti Saffinatunsalis','1331591',16,101),
(34,'yusutria LPP','$2b$10$woTX.rsDuFhVc7tIEzLifO2FAV4KjV7VglS.mm9JuwR97DJLdUeRG','Dr. Yusutria, S.Pd.I., M.A.','-',13,102),
(35,'safika LPP','$2b$10$jPJ0zFVuve4CKHFcnZQIaO44VtmF19QgIZYIMeZiomNU5YIojrhx.','Safika maranti, S.H.I, M.E','-',13,101),
(36,'imawan LPHU','$2b$10$AfoD.NdEB9Dqt51XJxY9ceJ3oo7F2lyeR4Mg5/El6lv/V1HENCpua','Ir. Imawan Wibisana, MT.','601.549',22,102),
(37,'tawar LPHU','$2b$10$6yIOM1L0tbNMeBhXgROBeOArsbxpfeNOVnLtiDVsStBQnnCskz5Xi','Tawar, S.Si, M.Kom','861.006',22,101),
(38,'suwarna LPCRPM','$2b$10$Fbwd8126dcEV3gbZJ.tP9OoBTo0LA/rf2KohLhu/wY5hra/ARSQwa','Suwarna, S.I.P, M.Si.','-',14,102),
(39,'febri LPCRPM','$2b$10$YNqHua9DCloqpqgHW.nNPePGchvSNeaNrWTwvyF4aTrNqAZHhVZMW','Febri Ahmad Fauzie, S.P., M.Si.','-',14,101),
(40,'arief MT','$2b$10$o19MIu.kK457au8O8tNSNOKdUT7CjP0YN0Xajiitxh5EjTjvZFuAi','Arief Bharata Al-Huda, S.Psi., MM.','1.125.831',3,102),
(42,'edo MT','$2b$10$WODIjWgxpHbvGEX1onoo1.e.vL/lfTw.QGsG2DZ7mLgu6Wz3BC//K','Edo Lestari, S.Pd., M.Psi.','1.214.488',3,101);

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
