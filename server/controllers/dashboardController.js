const User = require("../models/User");
const Report = require("../models/Report");
const LostFound = require("../models/LostFound");
const Community = require("../models/Community");
const Exam = require("../models/Exam");
const ExamDuty = require("../models/ExamDuty");

// Admin dashboard: campus-wide stats
const getAdminStats = async (req, res) => {
  try {
    const [
      totalStudents,
      totalTeachers,
      totalCRs,
      totalCommunities,
      totalReports,
      openReports,
      lostFoundItems,
      upcomingExams,
      recentReports,
    ] = await Promise.all([
      User.countDocuments({ role: "Student", isActive: true }),
      User.countDocuments({ role: "Teacher", isActive: true }),
      User.countDocuments({ role: "Student CR", isActive: true }),
      Community.countDocuments({}),
      Report.countDocuments({}),
      Report.countDocuments({ status: { $in: ["Submitted", "Under Review", "Assigned", "In Progress"] } }),
      LostFound.countDocuments({ status: "Open" }),
      Exam.countDocuments({ date: { $gte: new Date() } }),
      Report.find({}).sort({ createdAt: -1 }).limit(5).populate("reportedBy", "name role").select("reportId title category status priority createdAt reportedBy assignedTeam"),
    ]);

    const reportsByStatus = await Report.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      stats: {
        users: { students: totalStudents, teachers: totalTeachers, crs: totalCRs, total: totalStudents + totalTeachers + totalCRs },
        communities: totalCommunities,
        reports: { total: totalReports, open: openReports, byStatus: reportsByStatus },
        lostFound: { openItems: lostFoundItems },
        exams: { upcoming: upcomingExams },
        recentReports,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error.message);
    res.status(500).json({ success: false, message: "Unable to fetch dashboard stats" });
  }
};

// Teacher dashboard: assigned communities and exam duties
const getTeacherStats = async (req, res) => {
  try {
    const [ownedCommunities, myReports, duties] = await Promise.all([
      Community.find({ owner: req.user._id }).select("name year course section members posts").lean(),
      Report.countDocuments({ reportedBy: req.user._id }),
      ExamDuty.find({ teacher: req.user._id }).populate("exam", "subject date time year").sort({ date: 1 }).limit(10),
    ]);

    res.json({
      success: true,
      stats: {
        communities: ownedCommunities.length,
        communityList: ownedCommunities.map(c => ({
          _id: c._id,
          name: c.name,
          year: c.year,
          course: c.course,
          section: c.section,
          memberCount: c.members?.length || 0,
          postCount: c.posts?.length || 0,
        })),
        myReports,
        upcomingDuties: duties,
      },
    });
  } catch (error) {
    console.error("Teacher stats error:", error.message);
    res.status(500).json({ success: false, message: "Unable to fetch dashboard stats" });
  }
};

// Student / Student CR dashboard: personal data
const getStudentStats = async (req, res) => {
  try {
    const [myReports, openReports, myPosts, myLostFound] = await Promise.all([
      Report.countDocuments({ reportedBy: req.user._id }),
      Report.countDocuments({ reportedBy: req.user._id, status: { $nin: ["Resolved", "Rejected"] } }),
      Community.find({
        $or: [{ owner: req.user._id }, { members: req.user._id }]
      }).select("name year course section posts").lean(),
      LostFound.countDocuments({ postedBy: req.user._id }),
    ]);

    res.json({
      success: true,
      stats: {
        myReports,
        openReports,
        communities: myPosts.length,
        communityList: myPosts.map(c => ({ _id: c._id, name: c.name, year: c.year, course: c.course, section: c.section, postCount: c.posts?.length || 0 })),
        myLostFoundPosts: myLostFound,
      },
    });
  } catch (error) {
    console.error("Student stats error:", error.message);
    res.status(500).json({ success: false, message: "Unable to fetch dashboard stats" });
  }
};

module.exports = { getAdminStats, getTeacherStats, getStudentStats };
